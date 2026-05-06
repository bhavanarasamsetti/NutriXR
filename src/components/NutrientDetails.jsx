import React from 'react';

function NutrientDetails({ selectedNutrient, onClose }) {
  if (!selectedNutrient) {
    return (
      <div className="nutrient-details-empty">
        <p>Tap a nutrient to see details</p>
      </div>
    );
  }

  const amount = selectedNutrient.amount ? selectedNutrient.amount.toFixed(2) : selectedNutrient.amount;
  const originalAmount = selectedNutrient.originalAmount ? selectedNutrient.originalAmount.toFixed(2) : null;

  return (
    <div className="nutrient-details">
      <div className="nutrient-details-header">
        <h4 className="nutrient-details-name">{selectedNutrient.name}</h4>
        <button
          type="button"
          className="nutrient-details-close"
          onClick={onClose}
          aria-label="Close nutrient details"
        >
          ✕
        </button>
      </div>
      <div className="nutrient-details-content">
        <div className="nutrient-details-value">
          <span className="label">Amount:</span>
          <span className="value">
            {amount ?? '--'} {selectedNutrient.unit ?? ''}
          </span>
        </div>
        {originalAmount && originalAmount !== amount && (
          <div className="nutrient-details-original">
            <span className="label">Original:</span>
            <span className="value">
              {originalAmount} {selectedNutrient.unit ?? ''}
            </span>
          </div>
        )}
        {selectedNutrient.benefit && (
          <div className="nutrient-details-benefit">
            <span className="label">Benefit:</span>
            <p className="value">{selectedNutrient.benefit}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NutrientDetails;
