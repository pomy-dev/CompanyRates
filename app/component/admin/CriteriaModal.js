import React, { useState } from 'react';
import { X } from 'lucide-react';

const CriteriaModal = ({ isOpen, onClose, onSave, selectedServicePoint }) => {
  const [criteriaList, setCriteriaList] = useState([]);
  const [newCriteria, setNewCriteria] = useState({ criteria: '', priority: 'high priority' });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCriteria({
      ...newCriteria,
      [name]: value,
    });

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!newCriteria.criteria.trim()) {
      newErrors.criteria = 'Criteria is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddCriteria = () => {
    if (validateForm()) {
      setCriteriaList([...criteriaList, { ...newCriteria }]);
      setNewCriteria({ criteria: '', priority: 'high priority' });
      setErrors({});
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(criteriaList);
    setCriteriaList([]);
    setNewCriteria({ criteria: '', priority: 'high priority' });
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setCriteriaList([]);
    setNewCriteria({ criteria: '', priority: 'high priority' });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <div className="bg-white rounded-md shadow-2xl w-md max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Criteria for {selectedServicePoint} [{criteriaList.length}]</h2>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            <div className="flex flex-row flex-wrap justify-around">
              {criteriaList.map((criteria, index) => (
                <span key={index} className="ml-2 text-sm rounded-md bg-green-200 text-gray-700 px-2 py-1 m-1">
                  {criteria.criteria} ({criteria.priority})
                </span>
              ))}
            </div>

            {/* Add Criteria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Criteria for {selectedServicePoint}
              </label>
              <div className="relative flex flex-col space-y-2">
                <input
                  type="text"
                  name="criteria"
                  value={newCriteria.criteria}
                  onChange={handleInputChange}
                  className={`w-full pl-4 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.criteria ? 'border-red-300' : 'border-gray-300'}`}
                  placeholder="Criteria name"
                />
                <select
                  name="priority"
                  value={newCriteria.priority}
                  onChange={handleInputChange}
                  className="w-full pl-4 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors border-gray-300"
                >
                  <option value="high priority">High Priority</option>
                  <option value="medium priority">Medium Priority</option>
                  <option value="low priority">Low Priority</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddCriteria}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                >
                  Add Criteria
                </button>
              </div>
              {errors.criteria && <p className="text-red-600 text-sm mt-1">{errors.criteria}</p>}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CriteriaModal;