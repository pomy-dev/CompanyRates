import { PiSpinner } from "react-icons/pi";

const LoadingModal = ({ isOpen, onClose, isLoading, action }) => {


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
      <div className="items-center justify-center">
        <PiSpinner className='h-20 w-20 animate-spin' />
        <p className="text-lg text-white mt-4">{action}...</p>
      </div>
    </div>
  );
};

export default LoadingModal;