import { deleteFileByUrl } from "./unlinkExistingFile";

export const deleteMultipleFile = async (imageUrl: string[]) => {
  const result = await Promise.all(imageUrl.map((url) => deleteFileByUrl(url)));
  return result;
};

export const deleteSingleFile = async (imageUrl: string) => {
  const result = await deleteFileByUrl(imageUrl);
  return result;
};
