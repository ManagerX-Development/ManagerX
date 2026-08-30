import { memo } from "react";
import { motion } from "framer-motion";
import { Star, Users, Quote, Zap, Server, Heart } from "lucide-react";
import { useStats } from "../../hooks/useStats";

const testimonials = [
  {
    name: "Lukas",
    role: "Server Owner",
    server: "Small Talk Central",
    members: "42",
    avatar: "L",
    avatarColor: "from-red-500 to-orange-500",
    rating: 5,
    text: "Einer der ersten 10 Server zu sein hat Vorteile! Der Entwickler hört direkt auf Feedback. Das Levelsystem ist schon jetzt besser als bei den großen Bots.",
  },
  {
    name: "Marcel",
    role: "Admin",
    server: "Dev Corner",
    members: "112",
    avatar: "M",
    avatarColor: "from-blue-500 to-purple-500",
    rating: 5,
    text: "ManagerX ist zwar noch jung, aber extrem stabil. Endlich mal kein überladener Bot, sondern Fokus auf das, was wir wirklich brauchen.",
  },
  {
    name: "Svenja",
    role: "Moderatorin",
    server: "Chill & Game",
    members: "85",
    avatar: "S",
    avatarColor: "from-pink-500 to-red-500",
    rating: 4,
    text: "Wir nutzen ManagerX für unsere Temporary Voice Channels. Funktioniert super intuitiv und das Setup war in 2 Minuten erledigt.",
  },
];

const TestimonialCard = memo(({ testimonial, index }: { testimonial: typeof testimonials[0]; index: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.5, delay: index * 0.12 }}
    whileHover={{ y: -10 }}
    className="group relative glass-strong rounded-[2.5rem] p-8 border border-white/10 hover:border-primary/30 hover:shadow-[0_0_50px_rgba(220,38,38,0.15)] transition-all duration-500 overflow-hidden"
  >
    {/* Quote icon decoration */}
    <div className="absolute top-6 right-6 opacity-10 group-hover:opacity-20 transition-opacity">
      <Quote className="w-12 h-12 text-primary" />
    </div>

    {/* Hover glow */}
    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]" />

    <div className="relative z-10">
      {/* Stars */}
      <div className="flex gap-1 mb-6">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${i < testimonial.rating ? "fill-amber-400 text-amber-400" : "text-white/10"}`}
          />
        ))}
      </div>

      <p className="text-slate-300 mb-8 text-lg leading-relaxed font-medium italic group-hover:text-white transition-colors">
        "{testimonial.text}"
      </p>

      <div className="flex items-center gap-4">
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${testimonial.avatarColor} flex items-center justify-center text-white font-black text-lg shadow-lg`}
        >
          {testimonial.avatar}
        </motion.div>
        <div className="flex-1">
          <div className="font-black text-base text-white tracking-tight">{testimonial.name}</div>
          <div className="text-sm text-muted-foreground font-medium">{testimonial.role}</div>
        </div>
      </div>

      {/* Server info footer */}
      <div className="mt-6 pt-5 border-t border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-3 h-3 text-primary/50" />
          <span className="text-[12px] font-black uppercase tracking-widest text-slate-500">{testimonial.server}</span>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
          <Users className="w-3 h-3 text-primary" />
          <span className="text-[11px] font-black text-primary">{testimonial.members}</span>
        </div>
      </div>
    </div>
  </motion.div>
));

export const Testimonials = memo(function Testimonials() {
  const { data: stats } = useStats();

  const statItems = [
    { icon: Server, label: "Aktive Server", value: stats.guilds > 0 ? `${stats.guilds}` : "16", color: "text-red-400" },
    { icon: Users, label: "Nutzer", value: stats.users > 0 ? `~${stats.users}` : "~300", color: "text-orange-400" },
    { icon: Zap, label: "Commands", value: "90+", color: "text-amber-400" },
    { icon: Heart, label: "Leidenschaft", value: "100%", color: "text-pink-400" },
  ];

  return (
    <section id="testimonials" className="relative py-40 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#080a0c] via-[#0a0508] to-[#080a0c]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_50%,rgba(220,38,38,0.06)_0%,transparent_60%)]" />
      <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-primary/10 blur-[150px] rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-accent/8 blur-[150px] rounded-full" />

      <div className="container mx-auto relative z-10 px-4">
        {/* Header */}
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-strong border border-white/10 mb-10 shadow-lg"
          >
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em] text-foreground/70">Community Feedback</span>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black mb-8 tracking-tighter uppercase italic"
          >
            Stimmen der{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary animate-gradient">
              Ersten Stunde
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl font-medium leading-relaxed"
          >
            Server-Owner und Admins, die ManagerX von Anfang an begleiten.
          </motion.p>
        </div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-16">
          {testimonials.map((testimonial, index) => (
            <TestimonialCard key={index} testimonial={testimonial} index={index} />
          ))}
        </div>

        {/* Live Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto"
        >
          {statItems.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className="glass rounded-[1.5rem] p-6 border border-white/5 hover:border-white/15 flex flex-col items-center text-center transition-all duration-300"
            >
              <item.icon className={`w-5 h-5 mb-3 ${item.color}`} />
              <div className={`text-3xl font-black mb-1 ${item.color}`}>{item.value}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{item.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
});