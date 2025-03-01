import React from 'react';

const SettlementList = ({ settlements, groupMembers }) => {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Suggested Settlements</h3>
      
      {settlements.length === 0 ? (
        <p className="text-gray-600">All balances are settled! No payments needed.</p>
      ) : (
        <div className="space-y-4">
          {settlements.map((settlement, index) => (
            <div key={index} className="border rounded p-4 flex justify-between items-center">
              <div>
                <p>
                  <span className="font-medium">{settlement.from.name}</span>
                  <span className="mx-2">pays</span>
                  <span className="font-medium">{settlement.to.name}</span>
                </p>
              </div>
              <div className="font-medium text-green-600">
                ${settlement.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-6 bg-yellow-50 p-4 rounded">
        <h4 className="font-medium mb-2">How to record a settlement</h4>
        <p className="text-sm text-gray-700">
          When someone pays their share, add an expense with the description "Payment" or "Settlement" and set the full amount to be paid by that person, with only the recipient in the split.
        </p>
      </div>
    </div>
  );
};

export default SettlementList;