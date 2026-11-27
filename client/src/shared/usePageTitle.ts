import { useEffect } from 'react'

// Sets the browser tab title in the same format as Subapp 1's _Layout:
// "<page title> - Learning Challenge Hub". Screen readers announce it when a page opens.
const usePageTitle = (title: string | null | undefined) => {
  useEffect(() => {
    if (title) document.title = `${title} - Learning Challenge Hub`
  }, [title])
}

export default usePageTitle
