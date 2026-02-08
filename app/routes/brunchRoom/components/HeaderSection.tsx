type Props = {
  name: string;
};

export default function HeaderSection({ name }: Props) {
  return (
    <div className="text-center">
      <h1 className="text-3xl font-bold text-white">Brunch Room</h1>
      <p className="text-gray-400 mt-1">Welcome, {name}</p>
    </div>
  );
}
