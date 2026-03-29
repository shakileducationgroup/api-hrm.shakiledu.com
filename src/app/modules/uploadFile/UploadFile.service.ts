// import httpStatus from 'http-status';
// import AppError from '../../errors/AppError';
// import {
//   deleteFromDigitalOceanAWS,
//   uploadToDigitalOceanAWS,
// } from '../../utils/uploadToDigitalOceanAWS';

// interface UploadResponse {
//   images: string[];
//   video?: string;
// }

// export type TUploadImage = {
//   url: string;
//   filename: string;
// };

// export type TFilePayload = {
//   filename: string;
//   path: string;
//   alt: string;
//   fieldname: string;
//   originalname: string;
//   encoding: string;
//   buffer: any;
//   mimetype: string;
//   size: number;
// };

// const uploadMultipleFilesToDigitalOcean = async (
//   files: TFilePayload[],
//   videoFile: TFilePayload,
// ): Promise<UploadResponse> => {
//   if ((!files || files.length === 0) && !videoFile) {
//     throw new AppError(httpStatus.BAD_REQUEST, 'No files provided for upload');
//   }

//   try {
//     const response: UploadResponse = {
//       images: [],
//       video: '',
//     };

//     // Upload images if they exist
//     if (files && files.length > 0) {
//       const imageUploads = await Promise.all(
//         files.map(async file => {
//           if (file) {
//             try {
//               const uploadResponse = await uploadToDigitalOceanAWS(file as any);

//               if (uploadResponse.Location) {
//                 return uploadResponse.Location;
//               }
//             } catch (error) {
//               // console.error('Failed to upload image to DigitalOcean:', error);
//               throw new AppError(
//                 httpStatus.BAD_REQUEST,
//                 'Failed to upload image to DigitalOcean',
//               );
//             }
//           }
//         }),
//       );
//       response.images = imageUploads.filter(
//         url => url !== undefined,
//       ) as string[];
//     }

//     // Upload video file if it exists
//     if (videoFile) {
//       try {
//         const videoUploadResponse = await uploadToDigitalOceanAWS(
//           videoFile as any,
//         );

//         if (videoUploadResponse.Location) {
//           response.video = videoUploadResponse.Location;
//         }
//       } catch (error) {
//         // console.error('Failed to upload video to DigitalOcean:', error);
//         throw new AppError(
//           httpStatus.BAD_REQUEST,
//           'Failed to upload video to DigitalOcean',
//         );
//       }
//     }

//     return response;
//   } catch (error) {
//     // console.error('Failed to upload files to DigitalOcean:', error);
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Failed to upload files to DigitalOcean',
//     );
//   }
// };

// const deleteFileFromDigitalOcean = async (url: string) => {
//   try {
//     await deleteFromDigitalOceanAWS(url);
//   } catch (error) {
//     // console.error('Failed to delete file from DigitalOcean:', error);
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Failed to delete file from DigitalOcean',
//     );
//   }
// };

// const uploadSingleFile = async (file: any) => {
//   try {
//     const response = await uploadToDigitalOceanAWS(file as any);
//     return response.Location;
//   } catch (error) {
//     throw new AppError(
//       httpStatus.BAD_REQUEST,
//       'Failed to upload image to DigitalOcean',
//     );
//   }
// };

// export const UploadServiceServices = {
//   uploadMultipleFilesToDigitalOcean,
//   deleteFileFromDigitalOcean,
//   uploadSingleFile,
// };
