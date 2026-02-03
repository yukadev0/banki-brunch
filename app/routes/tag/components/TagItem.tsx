import { Form } from "react-router";

type Props = {
  tag: string;
};

export function TagItem({ tag }: Props) {
  return (
    <Form method="post">
      <input type="hidden" name="name" value={tag} />
      <button className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-lg transition transform shadow-md">
        {tag}
      </button>
    </Form>
  );
}
