import React, { useEffect, useRef, useState } from "react";
import { isEqual } from "lodash";

import { UPDATE_AVAILABILITY_EVENT_NAME } from "YJ~Shared/AvailabilityControls/Constants";

import type { RootState } from "YJ~Shared/Redux";

/**
 *
 * This acts as a listener if the dispatch prop is provided.
 * This acts as a broadcaster if the state prop is provided
 * Don't provide both props in one place.
 *
 */
interface ReduxSyncProps<T> {
    eventName: string;
    state?: T;
    dispatch?: (state: T) => void;
}

export const ReduxSync = <T = RootState,>(props: ReduxSyncProps<T>) => {
    const { state = undefined, dispatch, eventName = UPDATE_AVAILABILITY_EVENT_NAME } = props;
    const previousState = useRef<T | undefined>(state);

    // Listener
    useEffect(() => {
        // If a dispatch was provided this should send the event.detail to a redux store (defined externally).
        const handleAvailabilityUpdate = (event: CustomEvent<T>) => {
            if (dispatch && !isEqual(event.detail, previousState.current)) {
                // The activity has changed, update the store. These types are the same.
                dispatch(event.detail);
            }
        };

        document.addEventListener(eventName, handleAvailabilityUpdate as EventListener);

        return () => {
            document.removeEventListener(eventName, handleAvailabilityUpdate as EventListener);
        };
    }, [dispatch, eventName]);

    // Broadcaster
    useEffect(() => {
        // If the state was provided and changed this should broadcast the change as a CustomEvent
        if (state && !isEqual(state, previousState.current)) {
            previousState.current = state;
            const event = new CustomEvent<T>(eventName, {
                detail: state,
                bubbles: true,
            });

            document.dispatchEvent(event);
        }
    }, [state, eventName]);

    return null;
};

### Implementation 

interface ContrivedReduxState {
    example: number;
}

const SomeComponentInFirstApp = () => {
    const [broadcastState, setBroadcastState] = useState<ContrivedReduxState>({
        example: 22,
    });

    return (
        <div>
            <span>{broadcastState.example}</span>
            <ReduxSync<ContrivedReduxState> eventName="EXAMPLE_EVENT" state />
        </div>
    );
};

const SomeComponentInSecondApp = () => {
    const [listenerState, setListenerState] = useState<ContrivedReduxState>({
        example: 0,
    });

    return (
        <div>
            <span>{listenerState.example}</span>
            <ReduxSync<ContrivedReduxState> eventName="EXAMPLE_EVENT" dispatch={setListenerState} />
        </div>
    );
};