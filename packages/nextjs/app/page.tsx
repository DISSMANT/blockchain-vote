"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BugAntIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

interface Candidate {
  name: string;
  votes: bigint;
}

interface Winner {
  winnerIndex: bigint;
  winnerVotes: bigint;
}

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  const [newCandidate, setNewCandidate] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [winner, setWinner] = useState<Winner | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  const { data: ownerData } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "owner",
  });

  useEffect(() => {
    if (ownerData && connectedAddress) {
      setIsOwner(ownerData.toLowerCase() === connectedAddress.toLowerCase());
    } else {
      setIsOwner(false);
    }
  }, [ownerData, connectedAddress]);

  const { data: allCandidatesData, isLoading: isCandidatesLoading } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getAllCandidates",
    // watch: true,
  });

  const { data: winnerData, isLoading: isWinnerLoading } = useScaffoldReadContract({
    contractName: "YourContract",
    functionName: "getWinner",
    // watch: true,
  });

  const { writeContractAsync: addCandidateAsync, isMining: isAdding } = useScaffoldWriteContract("YourContract");
  const { writeContractAsync: voteAsync, isMining: isVoting } = useScaffoldWriteContract("YourContract");

  useEffect(() => {
    if (allCandidatesData) {
      // allCandidatesData - это массив объектов { name: string; voteCount: bigint }
      const fetchedCandidates: Candidate[] = (allCandidatesData as Array<{ name: string; voteCount: bigint }>).map(
        candidate => ({
          name: candidate.name,
          votes: candidate.voteCount,
        }),
      );
      setCandidates(fetchedCandidates);
    }
  }, [allCandidatesData]);

  useEffect(() => {
    if (winnerData) {
      const [winnerIndex, winnerVotes] = winnerData as [bigint, bigint];
      setWinner({
        winnerIndex,
        winnerVotes,
      });
    }
  }, [winnerData]);

  const handleAddCandidate = async () => {
    if (!newCandidate) return;
    try {
      await addCandidateAsync({
        functionName: "addCandidate",
        args: [newCandidate],
      });
      setNewCandidate("");
    } catch (e) {
      console.error("Ошибка при добавлении кандидата:", e);
    }
  };

  const handleVote = async () => {
    if (selectedCandidate === null) return;
    try {
      await voteAsync({
        functionName: "vote",
        args: [BigInt(selectedCandidate)],
      });
      setSelectedCandidate(null);
    } catch (e) {
      console.error("Ошибка при голосовании:", e);
    }
  };

  return (
    <>
      <div className="flex items-center flex-col flex-grow pt-10">
        <div className="px-5">
          <h1 className="text-center">
            <span className="block text-2xl mb-2">
              Добро пожаловать в систему голосования, основанную на технологии
            </span>
            <span className="block text-4xl font-bold">БЛОКЧЕЙН</span>
          </h1>
          <div className="flex justify-center items-center space-x-2 flex-col sm:flex-row">
            <p className="my-2 font-medium">Подключенный адрес:</p>
            <Address address={connectedAddress} />
          </div>
        </div>

        {/* Форма добавления кандидата (только для владельца) */}
        {isOwner && (
          <div className="mt-8 w-full max-w-md">
            <h2 className="text-2xl mb-4">Добавить Кандидата</h2>
            <input
              type="text"
              value={newCandidate}
              onChange={e => setNewCandidate(e.target.value)}
              placeholder="Имя кандидата"
              className="input input-bordered w-full mb-4"
            />
            <button className="btn btn-primary w-full" onClick={handleAddCandidate} disabled={isAdding}>
              {isAdding ? "Добавление..." : "Добавить Кандидата"}
            </button>
          </div>
        )}

        {/* Список кандидатов и голосование */}
        <div className="mt-16 w-full max-w-2xl">
          <h2 className="text-2xl mb-4">Кандидаты</h2>
          {isCandidatesLoading ? (
            <p>Загрузка кандидатов...</p>
          ) : candidates.length > 0 ? (
            <ul className="list-disc list-inside">
              {candidates.map((candidate, index) => (
                <li key={index} className="flex justify-between items-center my-2">
                  <span>
                    {index}. {candidate.name} — {candidate.votes.toString()} голосов
                  </span>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSelectedCandidate(index)}
                    disabled={isVoting}
                  >
                    {isVoting && selectedCandidate === index ? "Голосование..." : "Голосовать"}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>Кандидаты отсутствуют.</p>
          )}
          {selectedCandidate !== null && (
            <button className="btn btn-primary mt-4" onClick={handleVote} disabled={isVoting}>
              {isVoting ? "Голосование..." : "Подтвердить Голос"}
            </button>
          )}
        </div>

        {/* Отображение победителя */}
        <div className="mt-16 w-full max-w-md">
          <h2 className="text-2xl mb-4">Текущий Победитель</h2>
          {isWinnerLoading ? (
            <p>Загрузка победителя...</p>
          ) : winner ? (
            <p>
              Индекс: {winner.winnerIndex.toString()}, Голосов: {winner.winnerVotes.toString()}
            </p>
          ) : (
            <p>Победитель еще не определен.</p>
          )}
        </div>

        <div className="flex-grow bg-base-300 w-full mt-16 px-8 py-12">
          <div className="flex justify-center items-center gap-12 flex-col sm:flex-row">
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <BugAntIcon className="h-8 w-8 fill-secondary" />
              <p>
                Настраивайте ваш смарт-контракт, используя вкладку{" "}
                <Link href="/debug" passHref className="link">
                  Debug Contracts
                </Link>
                .
              </p>
            </div>
            <div className="flex flex-col bg-base-100 px-10 py-10 text-center items-center max-w-xs rounded-3xl">
              <MagnifyingGlassIcon className="h-8 w-8 fill-secondary" />
              <p>
                Изучайте ваши локальные транзакции с помощью вкладки{" "}
                <Link href="/blockexplorer" passHref className="link">
                  Block Explorer
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
