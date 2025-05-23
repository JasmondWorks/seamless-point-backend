const Delivery = require("../models/deliveryModel");
const Notifications = require("../models/notificationModel");
const Transaction = require("../models/transactionModel");
const User = require("../models/userModel");
const APIFEATURES = require("../utils/apiFeatures");
const AppError = require("../utils/appError");
const { catchAsync, filterObj } = require("../utils/helpers");
const { sendSuccessResponseData } = require("../utils/helpers");

module.exports.alistLatestUsers = (req, res, next) => {
  req.query.limit = "5";
  req.query.sort = "-createdAt";
  // req.query.fields = "firstName,lastName,email";
  // req.query.sort = '-ratingsAverage,price';
  // req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};
module.exports.getAllUser = catchAsync(async function (req, res) {
  const apiFeatures = new APIFEATURES(User, req.query)
    .filter()
    .limitFields()
    .sort()
    .paginate();

  const users = await apiFeatures.query;

  const totalUsers = await User.countDocuments({ active: true });

  sendSuccessResponseData(res, "users", users, totalUsers);
});

module.exports.updateMe = catchAsync(async (req, res) => {
  // 1) Throw error if user Post password data
  if (req.body.password || req.body.passwordConfirm)
    throw new AppError(
      "This route is not for password updates. Please use /updateMyPassword",
      400
    );

  // 2) We dont want to update the email and name and other sensitive info
  const filteredBody = filterObj(
    req.body,
    "dob",
    "lastName",
    "firstName",
    "gender",
    "profileImage"
  );

  const updatedUser = await User.findByIdAndUpdate(req.user._id, filteredBody, {
    new: true,
    runValidators: true,
  });
  console.log(updatedUser);
  sendSuccessResponseData(res, "user", updatedUser);
});
async function getBankNameFromCode(bankCode) {
  const res = await fetch("https://api.paystack.co/bank", {
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
    },
  });

  const json = await res.json();
  const bank = json.data.find((b) => b.code === bankCode);
  return bank?.name || null;
}
module.exports.updateBankDetails = catchAsync(async (req, res, next) => {
  const { accountNumber, bankCode } = req.body;

  if (!req.body.accountNumber || !req.body.bankCode)
    throw new AppError(
      "Account number, bank code or account name missing: {accountNumber, bankCode}",
      400
    );

  // 2) We dont want to update the email and name and other sensitive info

  const response = await fetch(
    `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      },
    }
  );

  const data = await response.json();
  const bankName = await getBankNameFromCode(bankCode);

  if (!response.ok) throw new AppError(data.message, 400);

  // Extract account name from Paystack response
  const accountName = data.data?.account_name;

  const bankDetails = {
    "bankDetails.accountNumber": accountNumber,
    "bankDetails.accountName": accountName,
    "bankDetails.bankCode": bankCode,
    "bankDetails.bankName": bankName,
  };

  const updatedUser = await User.findByIdAndUpdate(req.user._id, bankDetails, {
    new: true,
    runValidators: true,
  });
  sendSuccessResponseData(res, "user", updatedUser);
});
module.exports.deleteMe = catchAsync(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user.id, { active: false });

  if (!user) throw new AppError("User not found", 404);

  res.status(204).json({});
});

module.exports.getUser = catchAsync(async function (req, res) {
  const user = await User.findById(req.params.id);
  if (!user) throw new AppError("No user was found", 404);

  sendSuccessResponseData(res, "user", user);
});

module.exports.getUserByEmail = catchAsync(async function (req, res) {
  const email = req.query.email;
  const user = await User.findOne({ email });
  if (!user) throw new AppError("No user was found", 404);

  sendSuccessResponseData(res, "user", user);
});

module.exports.Me = catchAsync(async function (req, res) {
  const user = await User.findById(req.user.id);
  if (!user) throw new AppError("No user was found", 404);

  sendSuccessResponseData(res, "user", user);
});

module.exports.getMyDelivery = catchAsync(async function (req, res) {
  const apiFeatures = new APIFEATURES(
    Delivery.find({ user: req.user.id }),
    req.query
  )
    .filter()
    .sort()
    .paginate()
    .limitFields();

  const deliveries = await apiFeatures.query;

  sendSuccessResponseData(res, "deliveries", deliveries);
});

module.exports.getMyNotifications = catchAsync(async function (req, res) {
  const apiFeatures = new APIFEATURES(
    Notifications.find({ user: req.user.id }),
    req.query
  )
    .filter()
    .sort()
    .paginate()
    .limitFields();

  const notifications = await apiFeatures.query;

  sendSuccessResponseData(res, "notifications", notifications);
});
module.exports.getMyTransactions = catchAsync(async function (req, res) {
  const apiFeatures = new APIFEATURES(
    Transaction.find({ user: req.user.id }),
    req.query
  )
    .filter()
    .sort()
    .paginate()
    .limitFields();

  const transactions = await apiFeatures.query;

  sendSuccessResponseData(res, "transactions", transactions);
});
module.exports.getUserDelivery = catchAsync(async function (req, res) {
  const apiFeatures = new APIFEATURES(
    Delivery.find({ user: req.params.id }),
    req.query
  )
    .filter()
    .limitFields()
    .sort()
    .paginate();

  const deliveries = await apiFeatures.query;

  sendSuccessResponseData(res, "deliveries", deliveries);
});

module.exports.getUserNotifications = catchAsync(async function (req, res) {
  const apiFeatures = new APIFEATURES(
    Notifications.find({ user: req.params.id }),
    req.query
  )
    .filter()
    .limitFields()
    .sort()
    .paginate();

  const notifications = await apiFeatures.query;

  sendSuccessResponseData(res, "notifications", notifications);
});

// module.exports.getMyTransactions = catchAsync(async function (req, res) {
//   const apiFeatures = new APIFEATURES(
//     Transactions.find({ user: req.user.id }),
//     req.query
//   )
//     .filter()
//     .sort()
//     .paginate()
//     .limitFields();

//   const transactions = await apiFeatures.query;

//   sendSuccessResponseData(res, "transactions", transactions);
// });

// module.exports.getUserTransactions = catchAsync(async function (req, res) {
//   const apiFeatures = new APIFEATURES(
//     Transactions.find({ user: req.params.guestId }),
//     req.query
//   )
//     .filter()
//     .limitFields()
//     .sort()
//     .paginate();

//   const deliveries = await apiFeatures.query;

//   sendSuccessResponseData(res, "deliveries", deliveries);
// });

// module.exports.updateGuest = catchAsync(async function (req, res) {
//   return res.status(500).json({
//     status: "error",
//     data: "This route is not yet defined",
//   });
// });

// module.exports.deleteGuest = catchAsync(async function (req, res) {
//   return res.status(500).json({
//     status: "error",
//     data: "This route is not yet defined",
//   });
// });
