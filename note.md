### Ref

- Twilio SDK: https://www.twilio.com/en-us/blog/programmable-voice-javascript-quickstart-demo-node

👉 BLOCK emergency numbers

- 911
- 112
- 999
- 110

Example:

```javascript
if (["911", "112", "999"].includes(number)) {
  throw new Error("Emergency calls are not allowed");
}
```

### Remaining task

<!-- ❌ -->

- [✅] Implement the `branch` retrieve api's based on status is active or inactive.

### Note for 12th June 2026

- [❌] Lead assign api implementation.
  - Assign lead will follow:
    - The assigned user should be handle that country matched with the lead.
    - The assigner should be(if not a super admin) under that branch for that lead(lead branch)
    - If no user found for that country, return error.
- [❌] Counselor current workload showing in the dropdown.
- [❌] One lead would have multiple instance based on the country.
- [✅] Destination based counselor
- [✅] Assigned counselor to the country for country specific lead management.
- [✅] Mark lead as [new, unassigned] when lead is created.
- [✅] Another table for lead notes. country(relation), lead(relation), note(text), created_at(timestamp), created_by(user relation)
- [✅] Another table for user to be designated as <Role> for multiple countries. country[](relation), user(relation), role(enum: counselor, admin, manager)
- [✅] One lead would have multiple instance based on the country.

### Note for 13th June 2026

- [✅] Lead assign api implementation.
  - Assign lead will follow:
    - The assigned user should be handle that country matched with the lead.
    - The assigner should be(if not a super admin) under that branch for that lead(lead branch)
    - If no user found for that country, return error.

- [❌] Task assign to lead. Will be displayed on the task page too.
- [✅] Edit Lead
  - [✅] Lead status update
  - [✅] Lead info update

- [✅] Upload routes for all types of attachments upload
  - [✅] Maintain a single table for attachments. which will be relined with other tables
  - [✅] For `bulk upload`, `single upload`, `bulk delete` & `single delete`
  - [✅] Will maintain a status for track of archive or not.

- [❌] Task creation and assignment
- [❌] Task status update
- [❌] Task info update
- [❌] Task listing with filters
- [❌] Task deletion (soft delete)
- [❌] Task Schedule

- [❌] Socket setup for real-time notification and others
  - [❌] Trigger instant notification if task assigned by others
  - [❌] Got any new leads notify the bulk amount of user( & `branch manager`)
- [❌] Notification module for in-app notification management. Daily reminder
- [❌] Counselor current workload showing in the dropdown.

- [❌] Branch manager `Dashboard`
  - [❌] Will be able to see everyone under users list of his branch
- [❌] Counselor `Dashboard`
  - [❌] Will be able to see all the users under his branch

### Note for 14th June 2026

- [❌] Task assign to lead. Will be displayed on the task page too.

- [❌] Task creation and assignment
- [❌] Task status update
- [❌] Task info update
- [❌] Task listing with filters
- [❌] Task deletion (soft delete)
- [❌] Task Schedule

- [❌] Socket setup for real-time notification and others
  - [❌] Trigger instant notification if task assigned by others
  - [❌] Got any new leads notify the bulk amount of user( & `branch manager`)
- [❌] Notification module for in-app notification management. Daily reminder
- [❌] Counselor current workload showing in the dropdown.

- [❌] Branch manager `Dashboard`
  - [❌] Will be able to see everyone under users list of his branch
- [❌] Counselor `Dashboard`
  - [❌] Will be able to see all the users under his branch

### Note for 15th June 2026

- [✅] Task assign to lead. Will be displayed on the task page too.
- [✅] Task creation and assignment
- [✅] Task status update
- [✅] Task info update
- [❌] Task listing with filters
- [✅] Task deletion (soft delete)
- [❌] Task Schedule

- [❌] Socket setup for real-time notification and others
  - [❌] Trigger instant notification if task assigned by others
  - [❌] Got any new leads notify the bulk amount of user( & `branch manager`)
- [❌] Notification module for in-app notification management. Daily reminder
- [❌] Counselor current workload showing in the dropdown.

- [❌] Branch manager `Dashboard`
  - [❌] Will be able to see everyone under users list of his branch
- [❌] Counselor `Dashboard`
  - [❌] Will be able to see all the users under his branch

### Note for 18th June 2026

> Role based dashboard implementation

- [✅] Branch manager `Dashboard`
  - [✅] Will be able to see everyone under users list of his branch
- [✅] Counselor Head `Dashboard`
  - [✅] Will be able to see all the users under his branch

- [✅] _Leads_ Counselor `Dashboard`
  - [✅] Will be able to see only his/her assigned leads
- [✅] _Tasks_ Counselor `Dashboard`
  - [✅] Will be able to see only his/her assigned tasks
- [❌] _Metrics_ Counselor `Dashboard`
  - [❌] Will be able to see only his/her performance metrics
- [✅] _Own Branch Performance Metrics_ Counselor `Dashboard`
  - [✅] Will be able to see his branch performance metrics

### Note for 19th June 2026

> Role based dashboard implementation

- [✅] Notification module for in-app notification management.
  - [✅] Setup redis pub/sub for notification
  - [✅] Setup websocket server for instant notification
  - [✅] Trigger instant notification to the front-end via socket

### Note for 20th June 2026

> Role based dashboard implementation

- [❌] Daily reminder
  - [❌] Setup a cron job for daily reminder
  - [❌] Send daily reminder to the users about their tasks and leads
  - [❌] Re-scheduling the tasks

--

this is test for production
