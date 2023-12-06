export default defineEventHandler(async (event) => {
  console.log(event.context)
  const path = `/${event.context.params._.replace('api/drupal-ce', '')}`
  const drupalBaseUrl = useRuntimeConfig().public.drupalCe.baseURL
  return await proxyRequest(event, drupalBaseUrl + path)
});
