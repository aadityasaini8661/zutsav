const router      = require('express').Router();
const ctrl        = require('../controllers/admin.controller');
const panditPooja = require('../controllers/panditPooja.controller');
const settingsCtrl = require('../controllers/systemSettings.controller');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/dashboard',                    ctrl.getDashboard);

// Pandits
router.get('/pandits',                      ctrl.getPandits);
router.patch('/pandits/:id/approve',        ctrl.approvePandit);
router.patch('/pandits/:id/kyc',            ctrl.updateKYCStatus);
router.delete('/pandits/:id',               ctrl.deletePandit);
router.get('/pandits/available',            ctrl.getAvailablePandits);

// Pandit Poojas approval queue
router.get('/pandit-poojas',               panditPooja.adminGetPanditPoojas);
router.patch('/pandit-poojas/:id/approve', panditPooja.adminApprovePanditPooja);

// Users
router.get('/users',                        ctrl.getUsers);
router.patch('/users/:id/status',           ctrl.updateUserStatus);
router.patch('/users/:id/cancel-deletion',  ctrl.adminCancelDeletion);
router.delete('/users/:id',                 ctrl.adminDeleteUser);

// Bookings
router.get('/bookings',                          ctrl.getBookings);
router.patch('/bookings/:id/assign',             ctrl.assignPandit);
router.patch('/bookings/:id/status',             ctrl.updateBookingStatus);
router.patch('/bookings/:id/approve-completion', ctrl.approveCompletion);
router.patch('/bookings/:id/assign-payout',      ctrl.assignPayout);
router.patch('/bookings/:id/mark-payout-paid',   ctrl.markPayoutPaid);

// Marketplace Orders
router.get('/orders',                       ctrl.getOrders);
router.get('/orders/:id',                   ctrl.getOrderById);
router.patch('/orders/:id/status',          ctrl.updateOrderStatus);
router.patch('/orders/:id/shipment',        ctrl.updateOrderShipment);

// Education Masters
router.get('/education-masters',            ctrl.getEducationMasters);
router.post('/education-masters',           ctrl.createEducationMaster);
router.patch('/education-masters/:id',      ctrl.updateEducationMaster);
router.delete('/education-masters/:id',     ctrl.deleteEducationMaster);

// Specialization Masters
router.get('/specialization-masters',       ctrl.getSpecializationMasters);
router.post('/specialization-masters',      ctrl.createSpecializationMaster);
router.patch('/specialization-masters/:id', ctrl.updateSpecializationMaster);
router.delete('/specialization-masters/:id',ctrl.deleteSpecializationMaster);

// System Settings
router.get('/settings',   settingsCtrl.getSettings);
router.patch('/settings', settingsCtrl.updateSettings);

module.exports = router;
