<div className="h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden font-sans">
  <Header user={user} onSignOut={onSignOut} onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} onPresent={() => setIsPresenting(true)} onBackToDashboard={() => navigate('/')} onShare={() => {}} isSidebarOpen={isSidebarOpen} />
  <div className="flex-1 flex overflow-hidden">
    <main className="flex-1 overflow-y-auto w-full p-4 sm:p-6 lg:p-10 scroll-smooth"></main>
  </div>
</div>