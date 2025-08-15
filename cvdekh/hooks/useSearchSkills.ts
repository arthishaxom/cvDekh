import axios, { isAxiosError } from "axios";
import { useCallback, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import { useAuthStore } from "@/store/auth";

const searchCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useSkillsAutocomplete = () => {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const session = useAuthStore((state) => state.session);

  // Keep track of the current request to prevent race conditions
  const currentRequestRef = useRef<AbortController>(null);

  const fetchSkills = useCallback(
    async (query: string, category: string) => {
      category = category.slice(0, -1);
      if (!session) {
        return;
      }
      // Don't search for very short queries to reduce API load
      if (!query || query.trim().length < 2) {
        setSuggestions([]);
        return;
      }

      // Create a unique cache key for this search
      const cacheKey = `${query.toLowerCase()}-${category}`;
      const now = Date.now();

      // Check if we have a cached result that's still fresh
      if (searchCache.has(cacheKey)) {
        const cached = searchCache.get(cacheKey);
        if (now - cached.timestamp < CACHE_DURATION) {
          setSuggestions(cached.data);
          return;
        }
      }

      setIsLoading(true);
      setError(null);

      try {
        // Create an abort controller to cancel previous requests
        if (currentRequestRef.current) {
          currentRequestRef.current.abort();
        }

        const controller = new AbortController();
        currentRequestRef.current = controller;

        // Build the API URL with query parameters
        const params = new URLSearchParams({
          search: query.trim(),
          category: category,
          limit: "10", // Limit results for autocomplete
        });

        const response = await axios.get(
          `${process.env.EXPO_PUBLIC_API_URL}/api/v1/skills/?${params}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              // Add this header to bypass ngrok browser warning
              "ngrok-skip-browser-warning": "true",
              // Also add user-agent to make it look like a proper API request
              "User-Agent": "MyApp/1.0",
            },
            //   headers: {
            //     "Content-Type": "application/json",
            //   },
            signal: controller.signal,
          }
        );

        if (response.status !== 200) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.data.data;

        // Extract just the skill names for the autocomplete
        const skillNames =
          result.suggestions?.map((skill: { name: string }) => skill.name) ||
          [];

        // Cache the results for future use
        searchCache.set(cacheKey, {
          data: skillNames,
          timestamp: now,
        });

        setSuggestions(skillNames);
      } catch (err) {
        // Don't show errors for aborted requests (these happen when user types quickly)
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }
        if (isAxiosError(err)) {
          console.error("Axios Error Details:", {
            message: err.message,
            code: err.code,
            status: err.response?.status,
            statusText: err.response?.statusText,
            responseData: err.response?.data,
            config: err.config,
          });
        }
        console.error("Error fetching skills:", err);
        setError("Error Fetching Skills");
        setSuggestions([]);
      } finally {
        setIsLoading(false);
        currentRequestRef.current = null;
      }
    },
    [session]
  );

  // Debounce the API calls to avoid too many requests while user is typing
  const debouncedFetchSkills = useDebouncedCallback(fetchSkills, 300);

  // Function to clear suggestions (useful when input is cleared)
  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
    setError(null);
  }, []);

  return {
    suggestions,
    isLoading,
    error,
    searchSkills: debouncedFetchSkills,
    clearSuggestions,
  };
};
