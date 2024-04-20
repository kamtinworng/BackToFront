"use client";
import {
  DragDropContext,
  DropResult,
  Droppable,
  ResponderProvided,
} from "@hello-pangea/dnd";
import { Card, SimpleGrid, Button } from "@mantine/core";

function Page() {
  // Define your onDragEnd function to handle drop results
  const onDragEnd = (result: DropResult, provided: ResponderProvided) => {
    // Your drag end logic here
    if (!result.destination) {
      return;
    }

    const { source, destination } = result;

    // If the item was dropped back into its original position, do nothing
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <SimpleGrid cols={8}>
          {Array(64)
            .fill(0)
            .map((_, index) => {
              return (
                <Droppable droppableId={`droppable-${index}`} type="PERSON">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      style={{
                        backgroundColor: snapshot.isDraggingOver
                          ? "blue"
                          : "grey",
                      }}
                      {...provided.droppableProps}
                    >
                      <Button variant="outline" size="md"></Button>
                    </div>
                  )}
                </Droppable>
              );
            })}
        </SimpleGrid>
      </Card>
    </DragDropContext>
  );
}
export default Page;
