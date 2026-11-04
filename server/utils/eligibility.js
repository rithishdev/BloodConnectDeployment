/**
 * BloodConnect Donor Eligibility Screening Helper
 * Evaluates preliminary weight (>= 50kg) and donation interval (default 120 days).
 */

function evaluateEligibility({
  weightKg,
  hasDonatedBefore,
  lastDonationDate,
  minimumWeightThreshold = 50,
  requiredDonationIntervalDays = 120,
  currentMedicalStatus
}) {
  const weight = Number(weightKg) || 0;
  const isWeightValid = weight >= minimumWeightThreshold;
  
  let isIntervalValid = true;
  let nextDate = null;
  let daysSinceLast = null;

  const donatedBefore = hasDonatedBefore === true || hasDonatedBefore === 'true';

  if (donatedBefore) {
    if (!lastDonationDate) {
      isIntervalValid = false;
    } else {
      const prev = new Date(lastDonationDate);
      if (!isNaN(prev.getTime())) {
        const diffMs = Date.now() - prev.getTime();
        daysSinceLast = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (daysSinceLast < requiredDonationIntervalDays) {
          isIntervalValid = false;
          nextDate = new Date(prev.getTime() + requiredDonationIntervalDays * 24 * 60 * 60 * 1000);
        }
      } else {
        isIntervalValid = false;
      }
    }
  }

  let preliminaryEligibilityStatus = 'PRELIMINARILY ELIGIBLE';
  let medicalScreeningStatus = currentMedicalStatus || 'AWAITING_MEDICAL_SCREENING';
  let isAvailable = true;
  let availabilityStatus = 'Available';

  if (!isWeightValid || !isIntervalValid) {
    preliminaryEligibilityStatus = 'NOT ELIGIBLE';
    medicalScreeningStatus = 'NOT_ELIGIBLE';
    isAvailable = false;
    availabilityStatus = 'Inactive';
  } else if (currentMedicalStatus === 'MEDICALLY_CLEARED') {
    preliminaryEligibilityStatus = 'MEDICALLY CLEARED';
    medicalScreeningStatus = 'MEDICALLY_CLEARED';
    isAvailable = true;
    availabilityStatus = 'Available';
  }

  return {
    weightKg: weight,
    hasDonatedBefore: donatedBefore,
    lastDonationDate: donatedBefore && lastDonationDate ? new Date(lastDonationDate) : null,
    minimumWeightThreshold,
    requiredDonationIntervalDays,
    nextEligibleDonationDate: nextDate,
    preliminaryEligibilityStatus,
    medicalScreeningStatus,
    isAvailable,
    availabilityStatus,
    isWeightValid,
    isIntervalValid,
    daysSinceLast
  };
}

module.exports = { evaluateEligibility };
