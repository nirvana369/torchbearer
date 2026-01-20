import { useEffect, useState, useCallback } from "react";
import { useAssetBackendActor } from "./assetActor";
import { useInternetIdentity } from "./useInternetIdentity";

export function useAssetsActor() {
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
    } = useAssetBackendActor();
    
    const [isFetching, setIsFetching] = useState(false);
    const { identity } = useInternetIdentity();

    // Authenticate when identity is available
    useEffect(() => {
        if (identity) {
            void authenticate(identity);
        }
    }, [identity, authenticate]);

    // Function to fetch data - có thể gọi từ bên ngoài
    const fetchData = useCallback(async () => {
        if (!actor || isFetching) return null;
        
        try {
            setIsFetching(true);
            const data = await actor.whoami();
            console.log(data);
            return data;
        } catch (err) {
            console.error("Failed to fetch data:", err);
            throw err;
        } finally {
            setIsFetching(false);
        }
    }, [actor, isFetching]);

    // Tùy chọn: tự động fetch khi actor sẵn sàng
    useEffect(() => {
        if (actor && !isFetching) {
            // Chỉ fetch nếu cần
            // fetchData();
        }
    }, [actor, fetchData, isFetching]);

  return { actor, isFetching };
}