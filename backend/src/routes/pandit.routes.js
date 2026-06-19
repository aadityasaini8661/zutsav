const router = require('express').Router();
const ctrl   = require('../controllers/pandit.controller');
const { protect, authorize } = require('../middleware/auth');
const { uploadGovtId, uploadProfile, uploadKYCDocs } = require('../middleware/upload');

// Public
router.get('/', ctrl.getAll);
router.get('/catalog-poojas', ctrl.getCatalogPoojas); // must come before /me routes

// Protected — any logged-in user can register as pandit
router.post('/register', protect, uploadGovtId.single('govtIdImage'), ctrl.register);

// Pandit-only routes
router.use(protect, authorize('pandit', 'admin'));

router.get('/me',                    ctrl.getMyProfile);
router.get('/me/bookings',           ctrl.getMyBookings);
router.get('/me/ratings',            ctrl.getRatingHistory);
router.patch('/me',                  ctrl.updateMyProfile);
router.patch('/me/personal',         ctrl.updatePersonalInfo);
router.patch('/me/languages-address',ctrl.updateLanguagesAddress);
router.patch('/me/qualifications',   ctrl.updateQualifications);
router.patch('/me/specializations',  ctrl.updateSpecializations);
router.patch('/me/family',           ctrl.updateFamilyInfo);
router.patch('/me/upi',              ctrl.updateUPI);
router.post('/me/verify-upi',        ctrl.verifyUPI);
router.patch('/me/selected-poojas',  ctrl.updateSelectedPoojas);
router.patch('/me/pooja-charges',    ctrl.updatePoojaCharges);
router.patch('/me/bookings/:id/accept',              ctrl.acceptBooking);
router.patch('/me/bookings/:id/reject',              ctrl.rejectBooking);
router.patch('/me/bookings/:id/request-completion', ctrl.requestCompletion);
router.patch('/me/bank',             ctrl.updateBankDetails);
router.post('/me/kyc',               uploadKYCDocs, ctrl.submitKYC);
router.post('/me/photo',             uploadProfile.single('photo'), ctrl.uploadPhoto);
router.delete('/me/photo',           ctrl.removePhoto);

router.post('/me/availability',         ctrl.addAvailability);
router.patch('/me/availability/:slotId',ctrl.updateAvailability);
router.delete('/me/availability/:slotId',ctrl.deleteAvailability);

router.post('/me/block',         ctrl.blockPeriod);
router.delete('/me/block/:blockId',ctrl.unblockPeriod);

router.patch('/me/online-status', ctrl.setOnlineStatus);

// ── New structured availability ──────────────────────────────
router.put('/me/weekly-schedule',          ctrl.setWeeklySchedule);
router.post('/me/special-dates',           ctrl.addSpecialDate);
router.delete('/me/special-dates/:id',     ctrl.deleteSpecialDate);
router.patch('/me/toggle-availability',    ctrl.toggleAvailability);

module.exports = router;
