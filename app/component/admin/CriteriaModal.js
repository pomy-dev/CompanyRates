import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

const CriteriaModal = ({ isOpen, onClose, onSave, selectedServicePoint }) => {
  const [selectedCriteriaList, setSelectedCriteriaList] = useState([]);
  const [newCriteria, setNewCriteria] = useState({ criteria: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [errors, setErrors] = useState({});

  // Filter criteriaList based on search term
  const filteredCriteria = selectedServicePoint?.ServicePointRatingCriteria?.filter((criteria) =>
    criteria?.RatingCriteria?.title?.toLowerCase()?.includes(searchTerm?.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCriteria({
      ...newCriteria,
      [name]: value,
    });
    setSearchTerm(name === 'criteria' ? value : searchTerm);

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
      setSelectedCriteriaList([...selectedCriteriaList, { ...newCriteria }]);
      setNewCriteria({ criteria: '' });
      setSearchTerm('');
      setErrors({});
    }
  };

  const handleSelectCriteria = (criteria) => {
    if (!selectedCriteriaList.some(item => item.criteria === criteria.criteria)) {
      setSelectedCriteriaList([...selectedCriteriaList, criteria]);
    }
    setNewCriteria({ criteria: '' });
    setSearchTerm('');
    setErrors({});
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(selectedCriteriaList);
    setSelectedCriteriaList([]);
    setNewCriteria({ criteria: '' });
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setSelectedCriteriaList([]);
    setNewCriteria({ criteria: '' });
    setErrors({});
    onClose();
  };

  const handleRemove = (indexToRemove) => {
    setSelectedCriteriaList(selectedCriteriaList?.filter((_, index) => index !== indexToRemove));
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <div className="bg-white rounded-md shadow-2xl w-md max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add Criteria for {selectedServicePoint?.servicepoint} [{selectedCriteriaList?.length}]</h2>
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
            <div className="flex flex-row flex-wrap justify-start">
              {selectedCriteriaList?.map((criteria, index) => (
                <div key={index} className={`group flex justify-between items-center mr-3 text-sm rounded-md ${criteria.priority === 'high priority'
                  ? 'bg-red-200'
                  : criteria.priority === 'medium priority'
                    ? 'bg-blue-200'
                    : 'bg-slate-200'
                  } text-gray-700 px-2 py-1 m-1 transition-all duration-300`}>
                  {criteria?.RatingCriteria?.title}
                  <button key={index} type="button"
                    onClick={() => handleRemove(index)} className='opacity-0 group-hover:opacity-100 transform group-hover:scale-100 scale-90 transition-all duration-300 ease-in-out ml-4 rounded-full bg-red-400 hover:bg-red-600'>
                    <X className='h-5 w-5' />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Criteria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Criteria for {selectedServicePoint?.servicepoint}
              </label>

              <div className="relative flex flex-col space-y-2">
                <input
                  type="text"
                  name="criteria"
                  value={newCriteria.criteria}
                  onChange={handleInputChange}
                  className={`w-full pl-4 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.criteria ? 'border-red-300' : 'border-gray-300'
                    }`}
                  placeholder="Search or type criteria"
                />

                {searchTerm && (
                  <div className="mt-2 max-h-40 overflow-y-auto bg-white">
                    {filteredCriteria.length > 0 ? (
                      filteredCriteria.map((item, index) => (
                        <div
                          key={index}
                          onClick={() => handleSelectCriteria(item)}
                          className="border border-gray-200 rounded-lg px-4 py-2 hover:bg-blue-100 cursor-pointer text-sm text-gray-700"
                        >
                          {item?.RatingCriteria?.title}
                        </div>
                      ))
                    ) : (
                      <div className="flex items-center justify-center py-4 text-gray-500">
                        <AlertCircle className="h-5 w-5 mr-2" />
                        No matching criteria found
                      </div>
                    )}
                  </div>
                )}
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