"use client";

import {
  Anchor,
  Box,
  Button,
  Card,
  Container,
  Flex,
  Paper,
  TextInput,
  Title,
  Text,
  Group,
  Modal,
  SimpleGrid,
  Highlight,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { IconBriefcase, IconPlayCard, IconUrgent } from "@tabler/icons-react";
import { useDisclosure } from "@mantine/hooks";
import { initialItemCenter } from "./itemCenter";

interface user {
  id: string;
  name: string;
  cards: number[];
  items: string[];
}

interface drawCard {
  drawnCard: number;
  userId: string;
}

function Page() {
  const initialCardCenter: number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];

  const [cardCenter, setCardCenter] = useState<number[]>(initialCardCenter);
  const [itemCenter, setItemCenter] = useState<string[]>(initialItemCenter);
  const [name, setName] = useState<string>("");
  const [users, setUsers] = useState<user[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameTurn, setGameTurn] = useState<number>(0);
  const [opened, { open, close }] = useDisclosure(false);

  const [isFight, setIsFight] = useState(false);

  const [action, setAction] = useState<boolean[]>([false, false]);

  const findIdxUser = users.findIndex((user) => user.name === name);

  const joinGame = () => {
    const newSocket = io(
      "https://9c8f-2001-fb1-e2-18b1-d530-524e-2512-3bd.ngrok-free.app",
      {
        transports: ["websocket"],
        withCredentials: true,
      }
    );

    setSocket(newSocket);

    newSocket.emit("joinGame", { name });

    newSocket.on("userUpdate", (updatedUsers: user[]) => {
      setUsers(updatedUsers);
    });
  };

  const drawCard = () => {
    if (cardCenter.length > 0) {
      const randomIndex = Math.floor(Math.random() * cardCenter.length);
      const card = cardCenter[randomIndex];
      const userId = users[gameTurn].id;
      const countItem = Math.floor(Math.random() * 4);

      socket?.emit("drawCard", {
        drawnCard: card,
        userId: userId,
        countItem: countItem,
      });
    }
  };

  const onAction = () => {
    const userId = users[gameTurn].id;
    socket?.emit("action", userId, gameTurn);
  };

  socket?.on("action", (userId, index) => {
    // คัดลอก action เพื่อไม่ให้มีการอ้างอิงกับตัวแปรเดิม

    const perAction = [...action];

    if (perAction.every((val) => val === false)) {
      setIsFight(false);
    }
    // อัพเดทค่า perAction ตาม userId
    perAction[userId] = true;

    // อัพเดทค่า action โดยใช้ setAction
    setAction(perAction);

    // เปลี่ยนค่า gameTurn
    setGameTurn(gameTurn === 0 ? 1 : 0);

    // ตรวจสอบว่าทั้งหมดเป็น true หรือไม่
    if (perAction.every((val) => val === true)) {
      setIsFight(true);
    }
  });

  socket?.on("drawCard", (drawnCard) => {
    const currentUser = users[gameTurn];
    if (!currentUser) return;

    let item = [];

    for (let index = 0; index < drawnCard.drawnCard.countItem; index++) {
      const randomIndex = Math.floor(Math.random() * itemCenter.length);
      item.push(itemCenter[randomIndex]);
    }

    setUsers((prevUsers) => {
      let hasUpdated = false;
      const updatedUsers = prevUsers.map((user) => {
        if (!hasUpdated && user.id === drawnCard.drawnCard.userId) {
          if (user.cards.find((f) => f === drawnCard.drawnCard.drawnCard))
            return user;

          const updatedUser = {
            ...user,
            items: [...user.items, ...item],
            cards: [...user.cards, drawnCard.drawnCard.drawnCard],
          };
          hasUpdated = true;
          return updatedUser;
        }
        return user;
      });

      return updatedUsers;
    });

    setGameTurn(gameTurn === 0 ? 1 : 0);

    setAction([false, false]);

    setCardCenter((prevCards) =>
      prevCards.filter((card, index) => card !== drawnCard.drawnCard.drawnCard)
    );
  });

  const useItem = (item: string) => {
    socket?.emit("useItem", item);
  };

  useEffect(() => {
    const handleUseItem = (item: string) => {
      const currentUser = users[gameTurn];
      if (!currentUser) return;

      switch (item) {
        case "perfectCard":
          const totalCard = currentUser.cards.reduce(
            (accumulator, currentValue) => accumulator + currentValue,
            0
          );

          let currentCard = 21 - totalCard;

          if (currentCard > 11) {
            currentCard = cardCenter[cardCenter.length - 1];
          }

          setCardCenter((prevCards) =>
            prevCards.filter((card, index) => card !== currentCard)
          );
          const updatedUsersPerfectCard = [...users];

          const itemIndexPerfectCard =
            updatedUsersPerfectCard[gameTurn].items.indexOf(item);

          updatedUsersPerfectCard[gameTurn].items = updatedUsersPerfectCard[
            gameTurn
          ].items.filter((value, index) => index !== itemIndexPerfectCard);

          setUsers(updatedUsersPerfectCard);

          if (currentCard === 0) {
            break;
          }
          updatedUsersPerfectCard[gameTurn].cards.push(currentCard);

          updatedUsersPerfectCard[gameTurn].items.filter((f) => f !== item);

          setUsers(updatedUsersPerfectCard);

          break;
        case "dropYourCard":
          const updatedUsersDropYourCard = [...users];

          const pop = updatedUsersDropYourCard[gameTurn].cards.pop();

          updatedUsersDropYourCard[gameTurn].items.filter((f) => f !== item);

          const itemIndexDropYourCard =
            updatedUsersDropYourCard[gameTurn].items.indexOf(item);

          updatedUsersDropYourCard[gameTurn].items = updatedUsersDropYourCard[
            gameTurn
          ].items.filter((value, index) => index !== itemIndexDropYourCard);

          setUsers(updatedUsersDropYourCard);

          const copyCardCenterDropTourCard = [...cardCenter];

          copyCardCenterDropTourCard.push(parseInt(pop as unknown as string));

          copyCardCenterDropTourCard.sort((a, b) => a - b);

          setCardCenter(copyCardCenterDropTourCard);

          break;
        case "dropEnemyCard":
          const copyUserDropEnemyCard = [...users];
          const itemIndexDropEnemyCard =
            copyUserDropEnemyCard[gameTurn].items.indexOf(item);

          copyUserDropEnemyCard[gameTurn].items = copyUserDropEnemyCard[
            gameTurn
          ].items.filter((value, index) => index !== itemIndexDropEnemyCard);

          setUsers(copyUserDropEnemyCard);

          const isUser = gameTurn === 0 ? 1 : 0;
          const updatedUsersDropEnemyCard = [...users];

          const popEnemy = updatedUsersDropEnemyCard[isUser].cards.pop();

          updatedUsersDropEnemyCard[isUser].items.filter((f) => f !== item);

          setUsers(updatedUsersDropEnemyCard);

          const copyCardCenterDropEnemyCard = [...cardCenter];

          copyCardCenterDropEnemyCard.push(
            parseInt(popEnemy as unknown as string)
          );

          copyCardCenterDropEnemyCard.sort((a, b) => a - b);

          setCardCenter(copyCardCenterDropEnemyCard);

          break;
        default:
          const copyUser = [...users];

          // ค้นหาดัชนีของไอเท็มที่ต้องการลบจาก user.items
          const itemIndex = copyUser[gameTurn].items.indexOf(item);

          copyUser[gameTurn].items = copyUser[gameTurn].items.filter(
            (value, index) => index !== itemIndex
          );

          setUsers(copyUser);

          if (!cardCenter.find((f) => f === parseInt(item as string))) break;

          setCardCenter((prevCards) =>
            prevCards.filter((card, index) => card !== parseInt(item as string))
          );
          copyUser[gameTurn].cards.push(parseInt(item as string));

          break;
      }
    };

    // ตั้งค่า event listener สำหรับ "useItem"
    socket?.on("useItem", handleUseItem);

    // ทำลาย event listener เมื่อคอมโพเนนต์ถูกทำลาย
    return () => {
      socket?.off("useItem", handleUseItem);
    };
  }, [socket, users, gameTurn, cardCenter]);

  const items =
    users.length < 1
      ? ""
      : users[findIdxUser].items.map((item, index) => {
          if (item === "0") return null;
          return (
            //TODO: แก้ด้วย
            <Button
              variant="light"
              key={index}
              onClick={() => {
                useItem(item);
                close();
              }}
            >
              <Text size="xs">{item}</Text>
            </Button>
          );
        });

  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        size={"auto"}
        title="Item"
        centered
      >
        <Card withBorder radius="md">
          <SimpleGrid cols={3}>{items}</SimpleGrid>
        </Card>
      </Modal>
      <Container
        size={420}
        my={40}
        hidden={users.find((f) => f.name === name) ? true : false}
      >
        <Title ta="center">GAME 21</Title>
        <Text c="dimmed" size="sm" ta="center" mt={5}>
          by: munintorn.k{" "}
          <Anchor size="sm" component="button">
            https://discord.gg/RrbDY9Y8
          </Anchor>
        </Text>

        <Paper withBorder shadow="md" p={30} mt={30} radius="md">
          <TextInput
            label="name?"
            placeholder="Enter your name"
            required
            onChange={(e) => setName(e.currentTarget.value)}
          />
          <Button fullWidth mt="xl" onClick={joinGame}>
            JOIN GAME!
          </Button>
        </Paper>
      </Container>
      <Box hidden={users.find((f) => f.name === name) ? false : true}>
        <Group>
          <Button
            leftSection={<IconUrgent />}
            disabled={gameTurn !== findIdxUser || users.length < 2 || isFight}
            onClick={onAction}
          >
            ACTION
          </Button>
          <Button
            leftSection={<IconPlayCard />}
            onClick={drawCard}
            disabled={gameTurn !== findIdxUser || users.length < 2 || isFight}
          >
            DRAW A CARD
          </Button>
          <Button
            onClick={open}
            leftSection={<IconBriefcase />}
            disabled={gameTurn !== findIdxUser || users.length < 2 || isFight}
          >
            ITEM
          </Button>
        </Group>
      </Box>

      <Box>
        {users.map((user, i) => {
          const isUser = user.name === name;
          return (
            <>
              <Highlight highlight={"Action"}>
                {action[i] ? `${user.name} action` : user.name}
              </Highlight>

              <Card shadow="sm" padding="lg" radius="md" withBorder>
                {user.cards.map((card, index) =>
                  card === 0 ? (
                    ""
                  ) : index !== 0 ? (
                    <div key={index}>{`Card ${card}`}</div>
                  ) : isFight ? (
                    <div key={index}>{`Card ${card}`}</div>
                  ) : (
                    <div key={index}>{`Card ${
                      isUser ? card : "ไม่ให้เห็น"
                    }`}</div>
                  )
                )}
              </Card>
              <Flex
                justify="flex-end"
                align="flex-end"
                direction="column"
                wrap="wrap"
              ></Flex>
            </>
          );
        })}
      </Box>
    </>
  );
}

export default Page;
