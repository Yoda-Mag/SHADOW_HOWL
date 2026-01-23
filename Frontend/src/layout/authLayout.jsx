import PropTypes from 'prop-types';

function AuthLayout({ children, title }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden">
      {/* Blue Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />

      <div className="max-w-md w-full z-10 bg-slate-900/40 backdrop-blur-xl p-10 rounded-3xl border border-white/5 shadow-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(37,99,235,0.4)]">
            <span className="text-white font-black text-xl">SH</span>
          </div>
          <h2 className="text-3xl font-bold text-white tracking-tight">{title}</h2>
        </div>
        {children}
      </div>
    </div>
  );
}
export default AuthLayout;

AuthLayout.propTypes = {
  children: PropTypes.node,
  title: PropTypes.string.isRequired,
};