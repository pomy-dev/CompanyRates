import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

const CriteriaModal = ({ isOpen, onClose, onSave, selectedServicePoint }) => {
  const [selectedCriteriaList, setSelectedCriteriaList] = useState([]);

  const servicePointCriteria = selectedServicePoint?.ServicePointRatingCriteria?.filter((criteria) =>
    criteria?.RatingCriteria?.title?.toLowerCase());

  const handleSelectCriteria = (criteria) => {
    const isSelected = selectedCriteriaList.some(item => item?.title === criteria?.title);

    if (!isSelected) {
      setSelectedCriteriaList([...selectedCriteriaList, { ...criteria }]);
    } else {
      setSelectedCriteriaList(selectedCriteriaList.filter(item => item?.title !== criteria?.title));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(selectedCriteriaList)
    onSave(selectedCriteriaList);
    setSelectedCriteriaList([]);
    onClose();
  };

  const handleClose = () => {
    setSelectedCriteriaList([]);
    onClose();
  };

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
            <div>
              <div className="relative flex flex-row flex-wrap max-h-40 overflow-y-auto bg-white">
                {servicePointCriteria.length > 0 ? (
                  servicePointCriteria.map((item, index) => (
                    <div key={index} className='group flex justify-between items-center mr-3 text-sm rounded-sm border text-gray-700 px-2 py-1 m-1 transition-all duration-300'>
                      <span className="mr-2 text-sm font-medium text-gray-700">{item?.RatingCriteria?.title}</span>
                      <input type='checkbox'
                        name={item?.RatingCriteria?.title}
                        checked={selectedCriteriaList.some(fc => fc?.title === item?.RatingCriteria?.title)}
                        onChange={() => handleSelectCriteria(item?.RatingCriteria)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center py-4 text-gray-500">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    No matching criteria found
                  </div>
                )}
              </div>
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