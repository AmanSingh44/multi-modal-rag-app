import React from "react";

//https://jsonplaceholder.typicode.com/todos

import { useQuery } from "@tanstack/react-query";

const RQ = () => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: "todos",
    queryFn: () =>
      fetch("https://jsonplaceholder.typicode.com/todos").then((res) =>
        res.json()
      ),
  });
  return (
    <>
      <div>
        {data.map((todo) => (
          <div>{todo.title}</div>
        ))}
      </div>
      ;
    </>
  );
};

export default RQ;
