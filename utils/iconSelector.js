import {
  FcCollaboration,
  FcEngineering,
  FcBusinessman,
  FcManager,
  FcCustomerSupport,
} from "react-icons/fc";
import { FiShoppingBag } from "react-icons/fi";
import { FaRegCreditCard } from "react-icons/fa";

export const getIconForDepartment = (text) => {
  const lower = text.toLowerCase();
  if (lower.includes("sales")) return { icon: <FiShoppingBag />, iconName: "FiShoppingBag" };
  if (lower.includes("support") || lower.includes("technical")) return { icon: <FcEngineering />, iconName: "FcEngineering" };
  if (lower.includes("billing") || lower.includes("accounts")) return { icon: <FaRegCreditCard />, iconName: "FaRegCreditCard" };
  if (lower.includes("customer")) return { icon: <FcCustomerSupport />, iconName: "FcCustomerSupport" };
  if (lower.includes("communication")) return { icon: <FcManager />, iconName: "FcManager" };
  if (lower.includes("hr")) return { icon: <FcBusinessman />, iconName: "FcBusinessman" };
  if (lower.includes("it") || lower.includes("tech")) return { icon: <FcEngineering />, iconName: "FcEngineering" };

  return { icon: <FcCollaboration />, iconName: "FcCollaboration" }; // default
};

// Optional: export lookup
export const iconMap = {
  FcCollaboration: <FcCollaboration />,
  FcEngineering: <FcEngineering />,
  FcBusinessman: <FcBusinessman />,
  FcManager: <FcManager />,
  FcCustomerSupport: <FcCustomerSupport />,
  FiShoppingBag: <FiShoppingBag />,
  FaRegCreditCard: <FaRegCreditCard />,
};
