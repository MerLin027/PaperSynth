export const AnimatedDots = () => {
  return (
    <span className="inline-block">
      <span className="inline-block animate-bounce" style={{ animationDelay: '0s' }}>.</span>
      <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>.</span>
      <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>.</span>
    </span>
  );
};
