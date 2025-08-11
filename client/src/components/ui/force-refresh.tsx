// Force refresh component to ensure UI changes are applied
export const ForceRefresh = () => {
  return <div key={Date.now()} className="hidden" />;
};