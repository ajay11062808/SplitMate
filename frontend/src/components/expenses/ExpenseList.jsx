import React from 'react';

const ExpenseList = ({ expenses }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };
  
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Recent Expenses</h3>
      
      {expenses.length === 0 ? (
        <p className="text-gray-600">No expenses yet.</p>
      ) : (
        <div className="space-y-4">
          {expenses.map(expense => (
            <div key={expense._id} className="border rounded p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{expense.description}</h4>
                  <p className="text-sm text-gray-600">
                    {formatDate(expense.date)} • Paid by {expense.paidBy.name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">${parseFloat(expense.amount).toFixed(2)}</p>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t">
                <h5 className="text-sm font-medium mb-2">Split Details</h5>
                <div className="grid grid-cols-2 gap-2">
                  {expense.splitAmong.map((split, index) => (
                    <div key={index} className="text-sm">
                      <span className="text-gray-600">{split.user.name}:</span> ${parseFloat(split.amount).toFixed(2)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpenseList;