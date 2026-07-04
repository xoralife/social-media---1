export default function Footer() {
  return (
    <footer className="border-t border-border bg-white">
      <div className="max-w-xl mx-auto px-4 h-10 flex items-center justify-center">
        <p className="text-xs text-gray-400">&copy; {new Date().getFullYear()} SocialApp. All rights reserved.</p>
      </div>
    </footer>
  )
}
