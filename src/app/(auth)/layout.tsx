interface Props {
    children: React.ReactNode;
};

const Layout = ({ children }: Props) => {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="w-full max-w-md">               
                {children}
            </div>
        </div>
    );  
};

export default Layout;

