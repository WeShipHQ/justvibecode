import { useCallback, useEffect, useState } from "react"

interface DisplayModel {
  id: string
  label: string
}

const MAX_RETRIES = 3
const RETRY_DELAY_MILLIS = 5000

export function useAvailableModels() {
  const [models, setModels] = useState<DisplayModel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  const fetchModels = useCallback(
    async (isRetry: boolean = false) => {
      if (!isRetry) {
        setIsLoading(true)
        setError(null)
      }

      try {
        const response = await fetch("/api/models")
        if (!response.ok) {
          throw new Error("Failed to fetch models")
        }
        const data = await response.json()
        const newModels = data.models.map(
          (model: { id: string; name: string }) => ({
            id: model.id,
            label: model.name,
          })
        )
        setModels(newModels)
        setIsLoading(false)
        setRetryCount(0)
      } catch (err) {
        const error = err as Error

        if (retryCount < MAX_RETRIES) {
          console.log(
            `Failed to fetch models. Retrying in ${
              RETRY_DELAY_MILLIS / 1000
            } seconds...`
          )
          setTimeout(() => {
            setRetryCount((prev) => prev + 1)
            fetchModels(true)
          }, RETRY_DELAY_MILLIS)
        } else {
          setError(error)
          setIsLoading(false)
        }
      }
    },
    [retryCount]
  )

  useEffect(() => {
    fetchModels()
  }, [fetchModels])

  return {
    models,
    isLoading,
    error,
    refetch: () => {
      setRetryCount(0)
      fetchModels()
    },
  }
}
