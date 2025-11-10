import React from "react";

export default function SelectField({
  label,
  id,
  name,
  value,
  onChange,
  disabled,
  required,
  options = [],
  containerClassName = "",
  labelClassName = "",
  selectClassName = "",
}) {
  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={id} className={`block text-sm font-medium text-gray-700 mb-2 ${labelClassName}`}>
          {label}
        </label>
      )}
      <select
        id={id}
        name={name || id}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''} ${selectClassName}`}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}