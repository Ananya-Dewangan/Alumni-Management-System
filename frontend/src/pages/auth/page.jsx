import { useState } from "react"
import LoginForm from "@/pages/auth/Login"
import RegisterForm from "@/pages/auth/Register"

export default function AuthPage() {

    const [isLogin, setIsLogin] = useState(true)

    const toggleForm = () => {
        setIsLogin((prev) => !prev)
    }

    return (
        <div >
            {isLogin ? (
                <LoginForm onToggle={toggleForm} />
            ) : (
                <RegisterForm onToggle={toggleForm} />
            )}
        </div>
    )
}
