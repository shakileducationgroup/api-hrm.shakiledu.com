// import { RequestHandler } from 'express';
// import httpStatus from 'http-status';
// import catchAsync from '../../utils/catchAsync';
// import sendResponse from '../../utils/sendResponse';
// import { UploadServiceServices } from './UploadFile.service';

// const uploadMultipleFiles: RequestHandler = catchAsync(async (req, res) => {
//   const result = await UploadServiceServices.uploadMultipleFilesToDigitalOcean(
//     req.body.images,
//     req.body.video,
//   );
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'File uploaded successfully',
//     data: result,
//   });
// });

// const deleteFileFromDigitalOcean: RequestHandler = catchAsync(
//   async (req, res) => {
//     const result = await UploadServiceServices.deleteFileFromDigitalOcean(
//       req.body.url,
//     );
//     sendResponse(res, {
//       statusCode: httpStatus.OK,
//       success: true,
//       message: 'File deleted successfully',
//       data: result,
//     });
//   },
// );

// const uploadSingleFile = catchAsync(async (req, res) => {
//   if (!req.file) {
//     return sendResponse(res, {
//       statusCode: httpStatus.BAD_REQUEST,
//       success: false,
//       message: 'No file provided',
//       data: null,
//     });
//   }
//   const result = await UploadServiceServices.uploadSingleFile(req.file);
//   sendResponse(res, {
//     statusCode: httpStatus.OK,
//     success: true,
//     message: 'File uploaded successfully',
//     data: result,
//   });
// });

// export const UploadImageControllers = {
//   uploadMultipleFiles,
//   deleteFileFromDigitalOcean,
//   uploadSingleFile,
// };
