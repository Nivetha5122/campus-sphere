import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, AlertCircle, Calendar, Megaphone,
  Building, MapPin, ClipboardList, BarChart2, FileText,
  Shield, GraduationCap, LogOut, ChevronRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_SECTIONS = [
  { label:"General", items:[
    { name:"Dashboard",        path:"/dashboard",    icon:LayoutDashboard },
    { name:"Announcements",    path:"/announcements",icon:Megaphone },
    { name:"Events",           path:"/events",       icon:Calendar },
  ]},
  { label:"Academic", items:[
    { name:"Attendance",       path:"/attendance",   icon:ClipboardList },
    { name:"Marks",            path:"/marks",        icon:BarChart2 },
    { name:"Notes & Syllabus", path:"/notes",        icon:FileText },
  ]},
  { label:"Campus", items:[
    { name:"Lost & Found",     path:"/lost-found",   icon:Package },
    { name:"Complaints",       path:"/complaints",   icon:AlertCircle },
    { name:"Room Booking",     path:"/booking",      icon:Building },
    { name:"Map & Bus Tracker",path:"/campus-map",   icon:MapPin },
  ]},
  { label:"Admin", roles:["admin"], items:[
    { name:"Admin Panel",      path:"/admin",        icon:Shield },
  ]},
];

const ROLE_BADGE = {
  admin:   "bg-red-500/20 text-red-400 border-red-500/30",
  teacher: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  student: "bg-accent/20 text-accent border-accent/30",
};

export default function Sidebar({ isOpen, closeSidebar }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout, hasRole } = useAuth();

  return (
    <div className={`
      fixed inset-y-0 left-0 z-[9999] w-64 bg-primary border-r border-white/8 flex flex-col shrink-0 overflow-y-auto transition-transform duration-300 ease-in-out
      lg:static lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}
    `}>
      <div className="px-4 py-5 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-accent/20 border border-accent/30 flex items-center justify-center">
            <GraduationCap size={16} className="text-accent"/>
          </div>
          <div>
            <span className="text-white font-bold text-sm tracking-tight block">CampusSphere</span>
            <span className="text-soft text-[10px]">Academic Platform</span>
          </div>
        </div>
        <button onClick={closeSidebar} className="lg:hidden p-1.5 text-soft hover:text-white transition">
           <ChevronRight size={18} className="rotate-180" />
        </button>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV_SECTIONS.map(section => {
          if (section.roles && !hasRole(...section.roles)) return null;
          return (
            <div key={section.label} className="pb-3">
              <p className="text-[10px] font-semibold text-soft/50 uppercase tracking-widest px-3 mb-1.5">{section.label}</p>
              {section.items.map(item => {
                const Icon = item.icon;
                const active = pathname === item.path || pathname.startsWith(item.path+"/");
                return (
                  <Link key={item.path} to={item.path} onClick={closeSidebar}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 group mb-0.5 ${
                      active?"bg-accent/20 text-white border border-accent/25":"text-soft hover:bg-white/5 hover:text-white"
                    }`}>
                    <Icon size={14} className={active?"text-accent":"text-soft group-hover:text-white transition"}/>
                    <span className="flex-1">{item.name}</span>
                    {active && <ChevronRight size={12} className="text-accent"/>}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      <div className="px-2 py-3 border-t border-white/8">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-white/5 transition">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-accent to-soft flex items-center justify-center text-xs font-bold text-white shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-medium truncate leading-none">{user?.name}</p>
            <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium capitalize mt-0.5 inline-block ${ROLE_BADGE[user?.role]}`}>{user?.role}</span>
          </div>
          <button onClick={()=>{logout();navigate("/");}} className="text-soft hover:text-red-400 transition shrink-0">
            <LogOut size={14}/>
          </button>
        </div>
      </div>
    </div>
  );
}
