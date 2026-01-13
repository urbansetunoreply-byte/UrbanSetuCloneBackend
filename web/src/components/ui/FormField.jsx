import React, { forwardRef } from "react";

const FormField = forwardRef(function FormField(
  {
    label,
    id,
    name,
    type = "text",
    value,
    onChange,
    placeholder,
    required,
    disabled,
    readOnly,
    autoComplete,
    startIcon = null,
    endAdornment = null,
    helperText = "",
    errorText = "",
    containerClassName = "",
    labelClassName = "",
    inputClassName = "",
    onKeyDown,
    ...rest
  },
  ref
) {
  const hasStart = !!startIcon;
  const baseInput =
    "w-full py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-400";
  const paddings = hasStart ? " pl-10 pr-4" : " px-4";

  return (
    <div className={containerClassName}>
      {label && (
        <label htmlFor={id} className={`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ${labelClassName}`}>
          {label}
        </label>
      )}
      <div className="relative">
        {hasStart && (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
            {startIcon}
          </div>
        )}
        <input
          id={id}
          name={name || id}
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          readOnly={readOnly}
          autoComplete={autoComplete}
          className={`${baseInput}${paddings} ${inputClassName} ${disabled ? " bg-gray-100 dark:bg-gray-900 cursor-not-allowed text-gray-500 dark:text-gray-500" : ""}`}
          {...rest}
        />
        {endAdornment}
      </div>
      {errorText ? (
        <p className="text-red-500 text-sm mt-2">{errorText}</p>
      ) : helperText ? (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{helperText}</p>
      ) : null}
    </div>
  );
});

export default FormField;
