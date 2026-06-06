function StatCard({ title, value, icon: Icon }) {
  return (
    <div className="border border-soft/20 rounded-2xl p-4 flex items-center justify-between bg-primary">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <h2 className="text-2xl font-semibold">{value}</h2>
      </div>

      {Icon && <Icon size={22} className="text-gray-400" />}
    </div>
  );
}

export default StatCard;