import { callWithNuxt } from '#app'
import { defu } from 'defu'
import { useRuntimeConfig, useState, useFetch, navigateTo, createError, useRoute, h, resolveComponent, setResponseStatus, useNuxtApp, useRequestHeaders, UseFetchOptions } from '#imports'

export const useDrupalCe = () => {

  const config = useRuntimeConfig().public.drupalCe

  /**
   * Processes the given fetchOptions to apply module defaults
   * @param fetchOptions Optional Nuxt useFetch options
   * @returns UseFetchOptions<any>
   */
  const processFetchOptions = (fetchOptions:UseFetchOptions<any> = {}) => {
    fetchOptions.baseURL = fetchOptions.baseURL ?? config.baseURL
    fetchOptions = defu(fetchOptions, config.fetchOptions)

    // Apply the request headers of current request, if configured.
    if (config.fetchProxyHeaders) {
      fetchOptions.headers = defu(fetchOptions.headers ?? {}, useRequestHeaders(config.fetchProxyHeaders))
    }
    return fetchOptions
  }

  /**
   * Fetches page data from Drupal, handles redirects, errors and messages
   * @param path Path of the Drupal page to fetch
   * @param useFetchOptions Optional Nuxt useFetch options
   */
  const fetchPage = async (path: string, useFetchOptions:UseFetchOptions<any> = {}) => {
    const nuxtApp = useNuxtApp()

    // Workaround for issue - useState is not available after async call (Nuxt instance unavailable)
    const pageState = useState(`page-${path}`, () => {})
    useFetchOptions.key = `page-${path}`
    useFetchOptions = processFetchOptions(useFetchOptions)

    if (config.addRequestContentFormat) {
      useFetchOptions.query = useFetchOptions.query ?? {}
      useFetchOptions.query._content_format = config.addRequestContentFormat
    }

    const { data: page, error } = await useFetch(path, useFetchOptions)

    if (page?.value?.redirect) {
      await navigateTo(page.value.redirect.url, {
        external: page.value.redirect.external,
        redirectCode: page.value.redirect.statusCode
      })
      return
    }

    if (error.value && (!error.value?.data?.content || config.customErrorPages)) {
      throw createError({ statusCode: error.value.status, statusMessage: error.value.message, data: error.value.data, fatal: true })
    }

    if (error.value) {
      callWithNuxt(nuxtApp, setResponseStatus, [error.value.status])
      page.value = error.value?.data
    }

    page.value?.messages && pushMessagesToState(page.value.messages)

    pageState.value = page
    return page
  }

  /**
   * Fetches menu data from Drupal (configured by menuEndpoint option), handles errors
   * @param name Menu name being fetched
   * @param useFetchOptions Optional Nuxt useFetch options
   */
  const fetchMenu = async (name: string, useFetchOptions:UseFetchOptions<any> = {}) => {
    const menuPath = config.menuEndpoint.replace('$$$NAME$$$', name)
    useFetchOptions = processFetchOptions(useFetchOptions)
    useFetchOptions.key = `menu-${name}`

    const { data: menu, error } = await useFetch(menuPath, useFetchOptions)

    if (error.value) {
      errorMenuHandler(error)
      return
    }
    return menu
  }

  /**
   * Use messages state
   */
  const getMessages = () => useState('drupal-ce-messages', () => [])

  /**
   * Use page data
   */
  const getPage = () => useState(`page-${useRoute().path}`)

  /**
   * Render elements from page data returned from fetchPage
   * @param customElement
   */
  const renderCustomElements = (customElement) => {
    return h(resolveComponent(customElement.element), customElement)
  }

  return {
    fetchPage,
    fetchMenu,
    getMessages,
    getPage,
    renderCustomElements,
  }
}

const pushMessagesToState = (messages) => {
  messages = Object.assign({ success: [], error: [] }, messages)
  const messagesArray = [
    ...messages.error.map(message => ({ type: 'error', message })),
    ...messages.success.map(message => ({ type: 'success', message }))
  ]
  if (!messagesArray.length) {
    return
  }
  process.client && useDrupalCe().getMessages().value.push(...messagesArray)
}

const errorMenuHandler = (error) => {
  process.client && useDrupalCe().getMessages().value.push({
    type: 'error',
    message: `Menu error: ${error.value.message}.`
  })
}
