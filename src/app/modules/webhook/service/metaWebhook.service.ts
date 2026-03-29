import axios from "axios";
import env from "../../../config/clean-env";
import { LeadSource } from "@prisma/client";
import { leadsRepository } from "../../leads/repository/leads.repository";

type MetaWebhookPayload = {
  object?: string;
  entry?: Array<{
    id?: string; // page_id
    time?: number;
    changes?: Array<{
      field?: string; // "leadgen"
      value?: {
        form_id?: string;
        leadgen_id?: string;
        created_time?: number;
        page_id?: string;
        ad_id?: string;
        adset_id?: string;
        campaign_id?: string;
      };
    }>;
  }>;
};

type WhatsAppWebhookPayload = {
  object: "whatsapp_business_account";
  entry?: Array<{
    id?: string;
    time?: number;
    changes?: Array<{
      field?: string;
      value?: {
        messaging_product?: string;
        metadata?: { display_phone_number?: string; phone_number_id?: string };
        contacts?: Array<{ profile?: { name?: string }; wa_id?: string }>;
        messages?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: string;
          interactive?: {
            type?: string;
            nfm_reply?: { response_json: string };
          };
        }>;
      };
    }>;
  }>;
};

class MetaWebhookService {
  async processLeadgenPayload(payload: MetaWebhookPayload) {
    const leadgenIds: Array<{
      leadgenId: string;
      pageId?: string;
      formId?: string;
      adId?: string;
      adsetId?: string;
      campaignId?: string;
    }> = [];

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "leadgen") continue;
        const leadgenId = change.value?.leadgen_id;
        if (!leadgenId) continue;

        leadgenIds.push({
          leadgenId,
          pageId: change.value?.page_id || entry.id,
          formId: change.value?.form_id,
          adId: change.value?.ad_id,
          adsetId: change.value?.adset_id,
          campaignId: change.value?.campaign_id,
        });
      }
    }

    // process sequentially (safe). Later you can parallelize or queue.
    for (const item of leadgenIds) {
      await this.syncOneLead(item);
    }
  }

  async processWhatsAppPayload(payload: WhatsAppWebhookPayload) {
    const items: Array<{
      externalId: string;
      phone: string;
      fullName: string;
      email: string;
      lastStudyLevel: string;
      flowToken?: string;
    }> = [];

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== "messages" || !change.value?.messages) continue;
        for (const message of change.value.messages) {
          if (
            message.type !== "interactive" ||
            message.interactive?.type !== "nfm_reply"
          )
            continue;
          const raw = message.interactive.nfm_reply?.response_json;
          if (!raw) continue;
          let data: Record<string, string>;
          try {
            data = JSON.parse(raw) as Record<string, string>;
          } catch {
            continue;
          }
          const mapped = this.mapWhatsAppResponseJson(data, message.from);
          if (!mapped.phone) continue;
          items.push({
            externalId: message.id,
            phone: mapped.phone,
            fullName: mapped.fullName,
            email: mapped.email,
            lastStudyLevel: mapped.lastStudyLevel,
            flowToken: data.flow_token,
          });
        }
      }
    }

    for (const item of items) {
      await this.syncOneWhatsAppLead(item);
    }
  }

  private mapWhatsAppResponseJson(
    data: Record<string, string>,
    fallbackPhone: string,
  ) {
    const get = (...keys: string[]) =>
      keys.map((k) => data[k]?.trim()).find(Boolean) ?? "";
    return {
      fullName: get("full_name", "name") || "Unknown",
      phone: get("phone_number", "phone") || fallbackPhone,
      email: get("email"),
      lastStudyLevel: get("last_study_level") || "NOT_PROVIDED",
    };
  }

  private async syncOneWhatsAppLead(item: {
    externalId: string;
    phone: string;
    fullName: string;
    email: string;
    lastStudyLevel: string;
    flowToken?: string;
  }) {
    const existingByExternalId = await leadsRepository.findByExternalId(
      item.externalId,
    );
    if (existingByExternalId) return;

    const existingByPhone = await leadsRepository.findByPhone(item.phone);
    if (existingByPhone) {
      await leadsRepository.updateLead({
        where: { id: existingByPhone.id },
        data: {
          source: LeadSource.WHATSAPP,
          ...(existingByPhone.externalId ? {} : { externalId: item.externalId }),
          notes: this.appendNote(
            existingByPhone.notes,
            "Duplicate from WhatsApp Flow",
          ),
        },
      });
      return;
    }

    await leadsRepository.createLead({
      fullName: item.fullName,
      phone: item.phone,
      email: item.email || undefined,
      lastStudyLevel: item.lastStudyLevel,
      source: LeadSource.WHATSAPP,
      externalId: item.externalId,
      tags: ["WHATSAPP", "FLOW"],
      notes: this.appendNote(
        undefined,
        `WhatsApp Flow: ${item.externalId}${item.flowToken ? ` | flow_token: ${item.flowToken}` : ""}`,
      ),
    } as any);
  }

  private async syncOneLead(meta: {
    leadgenId: string;
    pageId?: string;
    formId?: string;
    adId?: string;
    adsetId?: string;
    campaignId?: string;
  }) {
    // 1) fetch lead details from Graph API
    const lead = await this.fetchLeadFromGraph(meta.leadgenId);

    // 2) map field_data to your lead shape
    const mapped = this.mapFieldData(lead?.field_data || []);

    // Must have phone to create a lead in your system
    if (!mapped.phone) return;

    // 3) upsert/dedupe
    // Prefer external id dedupe (leadgen_id)
    const existingByExternalId = await leadsRepository.findByExternalId(
      meta.leadgenId,
    );
    if (existingByExternalId) return;

    // fallback: dedupe by phone (optional)
    const existingByPhone = await leadsRepository.findByPhone(mapped.phone);
    if (existingByPhone) {
      // Update existing lead with FB source + externalId + note
      await leadsRepository.updateLead({
        where: { id: existingByPhone.id },
        data: {
          source: LeadSource.FB_ADS,
          ...(existingByPhone.externalId ? {} : { externalId: meta.leadgenId }),
          // store raw meta if you add Json field later
          // sourceMeta: { ... } as any,
          notes: this.appendNote(
            existingByPhone.notes,
            "Duplicate from FB Instant Form",
          ),
        },
      });
      return;
    }

    // 4) create
    await leadsRepository.createLead({
      fullName: mapped.fullName || "Unknown",
      phone: mapped.phone,
      email: mapped.email || undefined,
      lastStudyLevel: mapped.lastStudyLevel || "NOT_PROVIDED",
      source: LeadSource.FB_ADS,
      externalId: meta.leadgenId,

      // you can store these in tags/notes now if you don't add sourceMeta yet
      tags: ["FB_ADS", "INSTANT_FORM"],
      notes: this.appendNote(
        undefined,
        `FB Leadgen: ${meta.leadgenId} | form: ${meta.formId || ""} | campaign: ${meta.campaignId || ""}`,
      ),

      // If your createLead requires preferredDestinations, then DO NOT call leadsService.createLead here.
      // This repository createLead should accept prisma create input (as it already does in your project).
    } as any);
  }

  private async fetchLeadFromGraph(leadgenId: string) {
    const url = `https://graph.facebook.com/v19.0/${leadgenId}`;
    const { data } = await axios.get(url, {
      params: {
        access_token: env.META_PAGE_ACCESS_TOKEN,
        fields:
          "created_time,field_data,ad_id,adset_id,campaign_id,form_id,platform,page_id",
      },
    });

    return data as {
      field_data: Array<{ name: string; values: string[] }>;
    };
  }

  private mapFieldData(fieldData: Array<{ name: string; values: string[] }>) {
    const get = (key: string) =>
      fieldData.find((f) => f.name === key)?.values?.[0]?.trim();

    // Common Meta keys: full_name, phone_number, email
    const fullName = get("full_name") || get("name") || "";
    const phone = get("phone_number") || get("phone") || "";
    const email = get("email") || "";

    // If you added custom questions in the instant form, put the exact names here
    const lastStudyLevel = get("last_study_level") || "";

    return { fullName, phone, email, lastStudyLevel };
  }

  private appendNote(existing: string | null | undefined, line: string) {
    const stamp = new Date().toISOString();
    const next = `[${stamp}] ${line}`;
    if (!existing) return next;
    return `${existing}\n${next}`;
  }
}

export const metaWebhookService = new MetaWebhookService();
