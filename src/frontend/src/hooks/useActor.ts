import { useEffect, useState } from "react";
import { useBackendActor } from "./actor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useActor() {
    const {
        actor,           // The actor instance (initialized with anonymous agent by default)
        authenticate,    // Function to authenticate the actor with an identity
        setInterceptors, // Function to set up interceptors
        isAuthenticated, // Boolean indicating if actor is authenticated
        status,          // 'initializing' | 'success' | 'error'
        isInitializing,  // status === 'initializing'
        isSuccess,       // status === 'success'
        isError,         // status === 'error'
        error,           // Any error that occurred during initialization
        reset,           // Function to reset the actor state
        clearError       // Function to clear error state
    } = useBackendActor();
    const [isFetching, setIsFetching] = useState(false);

    const {
        identity,
    } = useInternetIdentity();

    // Authenticate when identity is available
    useEffect(() => {
        if (identity) {
            void authenticate(identity);
        }
    }, [identity, authenticate]);

        // Use the actor (works with anonymous or authenticated)
    const fetchData = async () => {
        if (!actor) return;
        try {
            const data = await actor.ping();
            if (data == "pong") setIsFetching(true);
            console.log(data);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        }
    };

  return { actor, isFetching };
}