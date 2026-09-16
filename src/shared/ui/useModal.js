import { useState, useCallback } from 'react'

/**
 * Custom hook to manage modal state, data payload, and lifecycle.
 *
 * @param {boolean} [initialOpen=false] - Initial visibility state
 * @returns {object} Modal state and control functions
 *
 * @example
 * const { isOpen, openModal, closeModal, toggleModal, data } = useModal()
 * <Button onClick={() => openModal({ id: 123 })}>Edit</Button>
 * <Modal open={isOpen} onClose={closeModal}>...</Modal>
 */
export function useModal(initialOpen = false) {
  const [isOpen, setIsOpen] = useState(initialOpen)
  const [data, setData] = useState(null)

  const openModal = useCallback((payload = null) => {
    setData(payload)
    setIsOpen(true)
  }, [])

  const closeModal = useCallback(() => {
    setIsOpen(false)
    setData(null)
  }, [])

  const toggleModal = useCallback((payload = null) => {
    setIsOpen((prev) => {
      if (!prev) setData(payload)
      else setData(null)
      return !prev
    })
  }, [])

  return {
    isOpen,
    open: isOpen, // alias
    data,
    openModal,
    closeModal,
    toggleModal,
    setIsOpen,
  }
}

export default useModal
