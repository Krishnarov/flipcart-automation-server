// Scheduler service refactored for manual triggers. 
// Cron logic removed as per user request for manual start.

export const initJobsFromDB = async () => {
    // This can be used for cleanup or recovering interrupted jobs if needed.
    console.log('Scheduler initialized (Manual mode)');
};
