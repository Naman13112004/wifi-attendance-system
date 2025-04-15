import { format } from 'date-fns'

export const formatDate = (dateString) => {
  try {
    return format(new Date(dateString), 'MMM dd, yyyy hh:mm a')
  } catch {
    return dateString
  }
}

export const truncate = (str, length = 50) => {
  return str.length > length ? `${str.substring(0, length)}...` : str
}

export const getInitials = (name) => {
  return name.split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
}