/**
 * 格式化文件URL
 * @param url 
 * @returns 
 */
export const normalize = (url: string): string => {
  const tmpArr = url.split(/\/{2,}/)
  if (tmpArr.length > 2) {
    const [protocol, ...rest] = tmpArr
    url = protocol + '//' + rest.join('/')
  }
  return url
}

export const slash = (path: string): string => {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path)
  const hasNonAscii = /[^\u0000-\u0080]+/.test(path) // eslint-disable-line no-control-regex

  if (isExtendedLengthPath || hasNonAscii) {
    return path
  }

  return path.replace(/\\/g, '/')
}