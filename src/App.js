/* eslint-disable no-undef */
import React, { useState, useEffect } from "react";

import "./styles.css";

const msg = (message) => {
    console.log(message);
};

const App = () => {
    const [token] = useState(
        ""
    );
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [units, setUnits] = useState([]);

    useEffect(() => {
        wialon.core.Session.getInstance().initSession(
            "https://w.glonass24.com"
        );
        wialon.core.Session.getInstance().loginToken(token, "", (code) => {
            // Обработка логина
            if (code) {
                msg(wialon.core.Errors.getErrorText(code));
                return;
            }
            msg("Успешный вход в систему");
            setIsAuthorized(true);
            init();
        });
    }, [token]);

    const updateUnitState = (event) => {
        const eventedUnit = event.getTarget();

        setUnits((prevUnits) =>
            prevUnits.map((item) =>
                item.id === eventedUnit.getId()
                    ? {
                        id: eventedUnit.getId(),
                        name: eventedUnit.getName(),
                        lastMessageTime: eventedUnit.getLastMessage()
                            ? eventedUnit.getLastMessage().t
                            : 0,
                        raw: eventedUnit,
                        img: item.img,
                        sensors: eventedUnit.getSensors(), // Сохраняем сенсоры
                    }
                    : item
            )
        );
    };

    const init = () => {
        const sess = wialon.core.Session.getInstance(); // Получение сессии
        const flags =
            wialon.item.Item.dataFlag.base |
            wialon.item.Unit.dataFlag.lastMessage |
            wialon.item.Unit.dataFlag.sensors; // Флаги для данных

        sess.loadLibrary("itemIcon"); // Загрузка библиотеки иконок
        sess.loadLibrary("unitSensors");
        sess.updateDataFlags(
            [{ type: "type", data: "avl_unit", flags: flags, mode: 0 }],
            (code) => {
                if (code) {
                    msg(wialon.core.Errors.getErrorText(code));
                    return;
                }

                const loadedUnits = sess.getItems("avl_unit");
                if (!loadedUnits || !loadedUnits.length) {
                    msg("Единицы не найдены");
                    return;
                }

                const unitsState = loadedUnits.map((unit) => {
                    const sensors = unit.getSensors(); // Получаем сенсоры

                    console.log(`Сенсоры для ${unit.getName()}:`, sensors);
                    console.log(
                        `Тип сенсоров: ${typeof sensors}, Длина: ${
                            Object.keys(sensors).length
                        }`
                    );

                    return {
                        id: unit.getId(),
                        name: unit.getName(),
                        lastMessageTime: unit.getLastMessage()
                            ? unit.getLastMessage().t
                            : null,
                        raw: unit,
                        img: unit.getIconUrl(),
                        sensors: sensors, // Сохраняем сенсоры
                    };
                });

                unitsState.forEach((unit) =>
                    unit.raw.addListener("messageRegistered", updateUnitState)
                );

                setUnits(unitsState);
            }
        );
    };

    return (
        <div className="App">
            {!isAuthorized ? (
                <h5>Загрузка...</h5>
            ) : (
                <div className="list">
                    {units.map((u) => (
                        <div className="row" key={u.id}>
                            <div>
                                <b>Название:</b>
                                {u.raw.getName()}
                            </div>
                            <div>
                                <b>Сенсоры:</b>
                                {u.sensors &&
                                Object.keys(u.sensors).length > 0 ? (
                                    <ul>
                                        {Object.entries(u.sensors).map(
                                            ([key, sensor]) => (
                                                <li key={sensor.id}>
                                                    {sensor.n} :{" "}
                                                    {u.raw.calculateSensorValue(
                                                        sensor,
                                                        u.raw.getLastMessage()
                                                    ) === -348201.3876
                                                        ? "N/A"
                                                        : u.raw.calculateSensorValue(
                                                            sensor,
                                                            u.raw.getLastMessage()
                                                        )}
                                                </li>
                                            )
                                        )}
                                    </ul>
                                ) : (
                                    "Нет сенсоров"
                                )}
                            </div>
                            <div>
                                <img src={u.img} alt="img" />
                            </div>
                            <div>
                                <b>Время последнего сообщения:</b>{" "}
                                {u.lastMessageTime} {" или "}
                                {wialon.util.DateTime.formatTime(
                                    u.lastMessageTime,
                                    0
                                )}
                            </div>
                            <div>
                                <b>Последняя позиция:</b>
                                {!u.raw.getPosition()
                                    ? "-"
                                    : ` x: ${u.raw.getPosition().x}, y: ${
                                        u.raw.getPosition().y
                                    }`}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default App;
