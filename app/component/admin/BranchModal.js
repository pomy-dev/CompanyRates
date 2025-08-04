import React, { useState } from 'react';
import { X, Building2, MapPin, Mail, Phone, User, Binary, Boxes, MapPinned } from 'lucide-react';
import CriteriaModal from './CriteriaModal';
import { PiSpinner } from "react-icons/pi";

const BranchModal = ({ isOpen, onClose, onSave, servicePoints }) => {
  const [formData, setFormData] = useState({
    branchName: '',
    branchCode: '',
    branchType: '',
    location: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    manager: '',
    isActive: true,
    servicePoints: []
  });
  const [errors, setErrors] = useState({});
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
  const [selectedServicePoint, setSelectedServicePoint] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;

    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? e.target.checked : value,
    });

    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const handleServicePointToggle = (servicePoint) => {
    const isAlreadySelected = formData?.servicePoints?.some(sp => sp?.name === servicePoint?.servicepoint);

    if (isAlreadySelected) {

      setFormData((prev) => ({
        ...prev,
        servicePoints: prev.servicePoints.filter(sp => sp.name !== servicePoint?.servicepoint),
      }));

    } else {

      setFormData((prev) => ({
        ...prev,
        servicePoints: [...prev.servicePoints, { 
          id:servicePoint?.id,
          name: servicePoint?.servicepoint, criteria: [] }],
      }));

      setSelectedServicePoint(servicePoint);
      setIsCriteriaOpen(true);
    }
  };

  const handleSaveCriteria = (criteriaList) => {
    if (selectedServicePoint) {
      setFormData((prev) => {
        const updatedServicePoints = prev.servicePoints?.filter(
          (sp) => sp.name !== selectedServicePoint?.servicepoint
        );
        return {
          ...prev,
          servicePoints: [
            ...updatedServicePoints,
            {
              id:selectedServicePoint?.id,
              name: selectedServicePoint?.servicepoint,
              criteria: criteriaList,
            },
          ],
        };
      });
    }
    setIsCriteriaOpen(false);
    setSelectedServicePoint('');
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.branchName.trim()) newErrors.branchName = 'Branch name is required';
    if (!formData.branchCode.trim()) newErrors.branchCode = 'Branch code is required';
    if (!formData.branchType.trim()) newErrors.branchType = 'Branch type is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    if (!formData.contactEmail.trim()) newErrors.contactEmail = 'Contact email is required';
    if (!formData.manager.trim()) newErrors.manager = 'Manager name is required';

    if (formData.contactEmail && !/\S+@\S+\.\S+/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (validateForm()) {

        const formattedData = {
          ...formData,
          servicePoints: formData.servicePoints?.map(sp => ({
            name: sp.name,
            criteria: sp.criteria.map(c => ({
              id: c.id,
              title: c.title,
            })),
          })),
        };

        console.log('From Branch Modal')
        console.log(formattedData)

        onSave(formattedData);

        setFormData({
          branchName: '',
          branchCode: '',
          branchType: '',
          location: '',
          address: '',
          contactEmail: '',
          contactPhone: '',
          manager: '',
          isActive: true,
          servicePoints: [],
        });

        setErrors({});
        setIsLoading(false);
      }
    } catch (error) {
      console.log(error)
      setIsLoading(false);
    } finally {
      onClose();
    }

  };

  const handleClose = () => {

    setFormData({
      branchName: '',
      branchCode: '',
      branchType: '',
      location: '',
      address: '',
      contactEmail: '',
      contactPhone: '',
      manager: '',
      isActive: true,
      servicePoints: [],
    });

    setErrors({});
    setIsCriteriaOpen(false);
    setSelectedServicePoint('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <div className="bg-white rounded-md shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 p-2 rounded-lg mr-3">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Add New Branch</h2>
                <p className="text-sm text-gray-600">Create a new company branch location</p>
              </div>
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
            {/* Branch Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="flex block text-sm font-medium text-gray-700 mb-2"><Building2 className="transform h-5 w-5 text-gray-400 mr-2 ml-2" />Branch Name *</label>
                  <input
                    type="text"
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.branchName ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="e.g., Downtown Branch, West Office"
                  />
                  {errors.branchName && <p className="text-red-600 text-sm mt-1">{errors.branchName}</p>}
                </div>

                <div>
                  <label className="flex block text-sm font-medium text-gray-700 mb-2"><Binary className="transform h-5 w-5 text-gray-400 mr-2 ml-2" />Branch Code *</label>
                  <input
                    type="text"
                    name="branchCode"
                    value={formData.branchCode}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.branchCode ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Branch-A-2D, Branch-B-2D"
                  />
                  {errors.branchCode && <p className="text-red-600 text-sm mt-1">{errors.branchCode}</p>}
                </div>

                <div>
                  <label className="flex block text-sm font-medium text-gray-700 mb-2"><Boxes className="h-5 w-5 text-gray-400 mr-2 ml-2" />Branch Type *</label>
                  <input
                    type='text'
                    name="branchType"
                    value={formData.branchType}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.branchType ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Kioks, Sub branch, Main branch"
                  />
                  {errors.branchType && <p className="text-red-600 text-sm mt-1">{errors.branchType}</p>}
                </div>
              </div>
            </div>

            {/* Location Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex block text-sm font-medium text-gray-700 mb-2"><MapPin className="h-5 w-5 text-gray-400 mr-2 ml-2" />Location *</label>
                  <input
                    type="address"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.location ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Manzini, eSwatini,"
                  />
                  {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
                </div>

                <div>
                  <label className="flex block text-sm font-medium text-gray-700 mb-2"><MapPinned className="h-5 w-5 text-gray-400 mr-2 ml-2" />Address</label>
                  <input
                    type="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Complete street address & postal code"
                  />
                  {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="flex block text-sm font-medium text-gray-700 mb-2"><Mail className="h-5 w-5 text-gray-400 mr-2 ml-2" />Contact Email *</label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.contactEmail ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="branch@company.com"
                  />
                  {errors.contactEmail && <p className="text-red-600 text-sm mt-1">{errors.contactEmail}</p>}
                </div>

                <div>
                  <label className="flex block text-sm font-medium text-gray-700 mb-2"><Phone className="h-5 w-5 text-gray-400 mr-2 ml-2" />Contact Phone</label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="+ (268) 7812 3456"
                  />
                </div>

                <div>
                  <label className="flex block text-sm font-medium text-gray-700 mb-2"><User className="h-5 w-5 text-gray-400 mr-2 ml-2" />Branch Manager *</label>
                  <input
                    type="text"
                    name="manager"
                    value={formData.manager}
                    onChange={handleInputChange}
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.manager ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="Manager's full name"
                  />
                  {errors.manager && <p className="text-red-600 text-sm mt-1">{errors.manager}</p>}
                </div>
              </div>
            </div>

            {/* Service Points display */}
            {servicePoints.length > 0 && (
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-2">Select Service Point</label>
                <div className="flex flex-row flex-wrap justify-around">
                  {servicePoints?.map((service, index) => (
                    <label key={index} className="flex items-center rounded-full px-4 py-2 m-2 bg-blue-100">
                      <input
                        type="checkbox"
                        name={service?.servicepoint}
                        checked={formData?.servicePoints.some((sp) => sp?.name === service?.servicepoint)}
                        onChange={() => handleServicePointToggle(service)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">{service?.servicepoint}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Branch Status */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Branch Status</h3>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Branch is currently active and operational</span>
              </label>
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
              {isLoading ? <PiSpinner className="animate-spin" /> : 'Add'} Branch
            </button>
          </div>
        </form>
      </div>

      {/* add criteria */}
      <CriteriaModal
        isOpen={isCriteriaOpen}
        onClose={() => {
          setIsCriteriaOpen(false);
          setSelectedServicePoint('');
        }}
        onSave={handleSaveCriteria}
        selectedServicePoint={selectedServicePoint}
      />

    </div>
  );
};

export default BranchModal;