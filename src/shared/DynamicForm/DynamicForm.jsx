import { useState, useEffect } from 'react'

/**
 * DynamicForm component that renders forms from JSON schemas
 * 
 * Props:
 *   - schema: FormSchema object with id, version, and fields array
 *   - onSubmit: callback function that receives { data, schemaVersion }
 *   - initialValues: optional object with initial field values
 */
export function DynamicForm({ schema, onSubmit, initialValues = {} }) {
  const [formData, setFormData] = useState(initialValues)
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})

  // Determine which fields should be visible based on visibleWhen conditions
  const getVisibleFields = () => {
    if (!schema?.fields) return []
    
    return schema.fields.filter(field => {
      if (!field.visibleWhen) return true
      
      const { field: dependentField, equals } = field.visibleWhen
      const dependentValue = formData[dependentField]
      
      return dependentValue === equals
    })
  }

  const visibleFields = getVisibleFields()

  // Validate a single field
  const validateField = (field, value) => {
    if (field.required && (value === '' || value === null || value === undefined)) {
      return `${field.label} is required`
    }

    if (field.validation) {
      const { min, max, pattern, message } = field.validation

      if (field.type === 'number') {
        const numValue = Number(value)
        // Only validate if value is not empty and is a valid number
        if (value !== '' && !isNaN(numValue)) {
          if (min !== undefined && numValue < min) {
            return message || `${field.label} must be at least ${min}`
          }
          if (max !== undefined && numValue > max) {
            return message || `${field.label} must be at most ${max}`
          }
        }
      }

      if (field.type === 'text' && pattern) {
        const regex = new RegExp(pattern)
        if (value && !regex.test(value)) {
          return message || `${field.label} format is invalid`
        }
      }
    }

    return null
  }

  // Validate all fields
  const validateForm = () => {
    const newErrors = {}
    const newTouched = {}
    let isValid = true

    visibleFields.forEach(field => {
      const error = validateField(field, formData[field.key])
      if (error) {
        newErrors[field.key] = error
        newTouched[field.key] = true
        isValid = false
      }
    })

    setErrors(newErrors)
    setTouched(prev => ({ ...prev, ...newTouched }))
    return isValid
  }

  // Handle field change
  const handleChange = (fieldKey, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldKey]: value,
    }))

    // Clear error for this field when user starts typing
    if (errors[fieldKey]) {
      setErrors(prev => ({
        ...prev,
        [fieldKey]: null,
      }))
    }
  }

  // Handle field blur
  const handleBlur = (fieldKey) => {
    setTouched(prev => ({
      ...prev,
      [fieldKey]: true,
    }))

    // Validate on blur
    const field = schema.fields.find(f => f.key === fieldKey)
    if (field) {
      const error = validateField(field, formData[fieldKey])
      setErrors(prev => ({
        ...prev,
        [fieldKey]: error,
      }))
    }
  }

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault()

    if (validateForm()) {
      // Only include visible fields in submission
      const visibleData = {}
      visibleFields.forEach(field => {
        visibleData[field.key] = formData[field.key]
      })

      onSubmit({
        data: visibleData,
        schemaVersion: schema.version,
      })
    }
  }

  // Render field based on type
  const renderField = (field) => {
    const fieldError = errors[field.key]
    const isTouched = touched[field.key]
    const fieldValue = formData[field.key] ?? ''

    const commonProps = {
      id: field.key,
      name: field.key,
      value: fieldValue,
      onChange: (e) => handleChange(field.key, e.target.value),
      onBlur: () => handleBlur(field.key),
      className: `form-input ${fieldError && isTouched ? 'error' : ''}`,
    }

    switch (field.type) {
      case 'text':
        return (
          <input
            {...commonProps}
            type="text"
            placeholder={field.label}
          />
        )

      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            placeholder={field.label}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        )

      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
          />
        )

      case 'textarea':
        return (
          <textarea
            {...commonProps}
            placeholder={field.label}
            rows={4}
          />
        )

      case 'select':
        return (
          <select
            id={field.key}
            name={field.key}
            value={fieldValue}
            onChange={(e) => handleChange(field.key, e.target.value)}
            onBlur={() => handleBlur(field.key)}
            className={`form-input ${fieldError && isTouched ? 'error' : ''}`}
          >
            <option value="">Select {field.label.trim()}</option>
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'multi-select':
        return (
          <select
            {...commonProps}
            multiple
            value={Array.isArray(fieldValue) ? fieldValue : []}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, option => option.value)
              handleChange(field.key, selected)
            }}
          >
            {field.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'file':
        return (
          <input
            id={field.key}
            name={field.key}
            type="file"
            onChange={(e) => {
              const file = e.target.files?.[0]
              handleChange(field.key, file)
            }}
            onBlur={() => handleBlur(field.key)}
            className={`form-input ${fieldError && isTouched ? 'error' : ''}`}
          />
        )

      case 'boolean':
        return (
          <input
            id={field.key}
            name={field.key}
            type="checkbox"
            checked={fieldValue === true || fieldValue === 'true'}
            onChange={(e) => handleChange(field.key, e.target.checked)}
            onBlur={() => handleBlur(field.key)}
            className={`form-checkbox ${fieldError && isTouched ? 'error' : ''}`}
          />
        )

      default:
        return null
    }
  }

  if (!schema?.fields) {
    return <div>No form schema provided</div>
  }

  return (
    <form onSubmit={handleSubmit} className="dynamic-form">
      {visibleFields.map(field => {
        const fieldError = errors[field.key]
        const isTouched = touched[field.key]
        return (
          <div key={field.key} className="form-group">
            <label htmlFor={field.key} className="form-label">
              {field.label}
              {field.required && <span className="required">*</span>}
            </label>
            {renderField(field)}
            {fieldError && isTouched && (
              <div className="form-error">{fieldError}</div>
            )}
          </div>
        )
      })}
      <button type="submit" className="form-submit">
        Submit
      </button>
    </form>
  )
}
