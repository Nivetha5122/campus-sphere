function Badge({ text, color = "gray" }) {
  const colors = {
    green: "bg-green-500/20 text-green-300",
    yellow: "bg-yellow-500/20 text-yellow-300",
    red: "bg-red-500/20 text-red-300",
    gray: "bg-soft/20 text-soft",
};

  return (
    <span className={`px-2 py-1 text-xs rounded ${colors[color]}`}>
      {text}
    </span>
  );
}

export default Badge;