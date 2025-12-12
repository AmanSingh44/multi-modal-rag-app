import { useQuery } from "@tanstack/react-query";
import { getPostById } from "../api/chat";

export const PostById = ({ id }) => {
  const { data, isLoading, error, isError } = useQuery({
    queryKey: ["posts", id],
    queryFn: () => getPostById(id),
    staleTime: 5000,
  });

  if (isLoading) return <p>Loading...</p>;

  if (isError) return <p>Error occured: {error.message}</p>;

  return (
    <>
      <p>{data?.title}</p>
    </>
  );
};
