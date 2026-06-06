function ListCard({ title, children }) {
  return (
    <div className="border border-soft/20 rounded-2xl p-4 bg-primary">
      <h2 className="font-semibold mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export default ListCard;