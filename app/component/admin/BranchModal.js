import React, { useState } from 'react';
import { X, Building2, MapPin, Mail, Phone, User, Home } from 'lucide-react';
import CriteriaModal from './CriteriaModal';

const BranchModal = ({ isOpen, onClose, onSave, servicePoints }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    address: '',
    contactEmail: '',
    contactPhone: '',
    manager: '',
    isActive: true,
    servicePoints: [],
  });

  const [errors, setErrors] = useState({});
  const [isCriteriaOpen, setIsCriteriaOpen] = useState(false);
  const [selectedServicePoint, setSelectedServicePoint] = useState('');


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
    const isAlreadySelected = formData?.servicePoints?.some(sp => sp?.name === servicePoint?.name);

    if (isAlreadySelected) {
      setFormData((prev) => ({
        ...prev,
        servicePoints: prev.servicePoints.filter(sp => sp.name !== servicePoint.name),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        servicePoints: [...prev.servicePoints, { name: servicePoint.name, criteria: [] }],
      }));

      setSelectedServicePoint(servicePoint?.name);
      setIsCriteriaOpen(true);
    }
  };

  const handleSaveCriteria = (criteriaList) => {
    if (selectedServicePoint) {
      setFormData((prev) => {
        const updatedServicePoints = prev.servicePoints?.filter(
          (sp) => sp.name !== selectedServicePoint
        );
        return {
          ...prev,
          servicePoints: [
            ...updatedServicePoints,
            {
              name: selectedServicePoint,
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

    if (!formData.name.trim()) newErrors.name = 'Branch name is required';
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

    if (validateForm()) {
      const formattedData = {
        ...formData,
        servicePoints: formData.servicePoints.map(sp => ({
          name: sp.name,
          criteria: sp.criteria.map(c => ({
            title: c.criteria,
            priority: c.priority,
          })),
        })),
      };
      onSave(formattedData);
      setFormData({
        name: '',
        location: '',
        address: '',
        contactEmail: '',
        contactPhone: '',
        manager: '',
        isActive: true,
        servicePoints: [],
      });
      setErrors({});
      onClose();
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.name ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="e.g., Downtown Branch, West Office"
                    />
                  </div>
                  {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.location ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="City, State/Country"
                    />
                  </div>
                  {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Address *</label>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.address ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Complete street address including postal code"
                    />
                  </div>
                  {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.contactEmail ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="branch@company.com"
                    />
                  </div>
                  {errors.contactEmail && <p className="text-red-600 text-sm mt-1">{errors.contactEmail}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Branch Manager *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      name="manager"
                      value={formData.manager}
                      onChange={handleInputChange}
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.manager ? 'border-red-300' : 'border-gray-300'}`}
                      placeholder="Manager's full name"
                    />
                  </div>
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
                    <label key={index} className="flex items-center rounded-md m-2">
                      <input
                        type="checkbox"
                        name={service?.name}
                        checked={formData?.servicePoints.some((sp) => sp?.name === service?.name)}
                        onChange={() => handleServicePointToggle(service)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">{service?.name}</span>
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
              Add Branch
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